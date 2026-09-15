import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { getSettingValue } from "../services/settings.js";

// Tienda pública para padres — sección "no necesito que los padres tengan
// usuario y contraseña, tiene que ser abierto al público general".
// Sin requireAuth en NINGUNA ruta de este archivo, a propósito.
const router = Router();

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    res.json(categories);
  })
);

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVO" },
      include: { category: true },
      orderBy: { order: "asc" },
    });
    res.json(products);
  })
);

router.get(
  "/menu/today",
  asyncHandler(async (req, res) => {
    const day = req.query.date ? new Date(String(req.query.date)) : new Date();
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const menu = await prisma.dailyMenu.findFirst({
      where: { date: { gte: start, lt: end }, active: true },
      include: { items: { orderBy: { order: "asc" } } },
    });
    res.json(menu ?? null);
  })
);

router.get(
  "/carousel",
  asyncHandler(async (_req, res) => {
    const carousel = await prisma.carousel.findFirst({
      include: { images: { where: { active: true }, orderBy: { order: "asc" } } },
    });
    res.json(carousel);
  })
);

router.get(
  "/business-info",
  asyncHandler(async (_req, res) => {
    const [name, logo] = await Promise.all([
      getSettingValue("business.name", "Tendita Landy"),
      getSettingValue("business.logo", ""),
    ]);
    res.json({ name, logo });
  })
);

function buildWhatsAppMessage(order: {
  number: number;
  student: { name: string; grade: string; group: string | null };
  items: { quantity: number; unitPrice: number; product: { name: string } }[];
  total: number;
}) {
  const lines = [
    "Hola Tendita Landy 👋",
    "",
    "Quiero realizar el siguiente pedido:",
    "",
    `Alumno: ${order.student.name}`,
    `Grado: ${order.student.grade}`,
    ...(order.student.group ? [`Grupo: ${order.student.group}`] : []),
    "",
    ...order.items.map((i) => `${i.quantity}x ${i.product.name} $${i.unitPrice}`),
    "",
    `TOTAL: $${order.total}`,
    "",
    "Gracias.",
  ];
  return lines.join("\n");
}

const createOrderSchema = z.object({
  student: z.object({ name: z.string().min(1), grade: z.string().min(1), group: z.string().optional() }),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
});

// Pública: cualquier visitante puede armar su pedido y generar el mensaje de
// WhatsApp, sin cuenta. El registro en la base de datos existe para que el
// panel admin (Pedidos) pueda darle seguimiento una vez llega por WhatsApp.
router.post(
  "/orders",
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { student, items } = req.body;

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) }, status: "ACTIVO" },
    });
    if (products.length !== items.length) {
      throw new ApiError(400, "Uno o más productos no están disponibles");
    }

    const orderItems = items.map((i: any) => {
      const product = products.find((p: any) => p.id === i.productId)!;
      return { productId: product.id, quantity: i.quantity, unitPrice: product.price, subtotal: product.price * i.quantity };
    });
    const total = orderItems.reduce((sum: number, i: any) => sum + i.subtotal, 0);

    const studentRecord = await prisma.student.create({ data: student });

    const order = await prisma.order.create({
      data: {
        studentId: studentRecord.id,
        total,
        items: { create: orderItems },
        statusHistory: { create: [{ status: "RECIBIDO" }] },
      },
      include: { student: true, items: { include: { product: true } } },
    });

    const whatsappMessage = buildWhatsAppMessage(order as any);
    const whatsappNumber = await getSettingValue("whatsapp.number", env.WHATSAPP_NUMBER);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(201).json({ order, whatsappMessage, whatsappUrl, mode: env.WHATSAPP_MODE });
  })
);

export default router;
