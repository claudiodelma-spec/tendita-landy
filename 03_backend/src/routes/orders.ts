import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { env } from "../config/env.js";
import { getSettingValue } from "../services/settings.js";

const router = Router();

const createOrderSchema = z.object({
  student: z.object({ name: z.string().min(1), grade: z.string().min(1), group: z.string().optional() }),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
});

// Section 30: builds the exact WhatsApp message format from the spec example.
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

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, from, to } = req.query;
    // Section 6: PADRE only sees "Historial de pedidos" (their own orders);
    // ADMINISTRADOR/OPERADOR/GESTION see everything for order management.
    const isStaff = req.user!.roles.some((r: string) => ["ADMINISTRADOR", "OPERADOR", "GESTION"].includes(r));
    const orders = await prisma.order.findMany({
      where: {
        status: status ? (String(status) as any) : undefined,
        userId: isStaff ? undefined : req.user!.id,
        date: {
          gte: from ? new Date(String(from)) : undefined,
          lte: to ? new Date(String(to)) : undefined,
        },
      },
      include: { student: true, items: { include: { product: true } } },
      orderBy: { date: "desc" },
    });
    res.json(orders);
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { student: true, items: { include: { product: true } }, statusHistory: true },
    });
    if (!order) throw new ApiError(404, "Pedido no encontrado");

    const isStaff = req.user!.roles.some((r: string) => ["ADMINISTRADOR", "OPERADOR", "GESTION"].includes(r));
    if (!isStaff && order.userId !== req.user!.id) {
      throw new ApiError(403, "No tienes permisos para ver este pedido");
    }

    res.json(order);
  })
);

// Any authenticated user (including PADRE) can place an order.
router.post(
  "/",
  requireAuth,
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const { student, items } = req.body;

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) }, status: "ACTIVO" },
    });
    // NOTE: item quantities/product ids are already validated by createOrderSchema;
    // `any` here reflects that Prisma's generated types aren't available in this
    // sandbox (see PHASE 1 note in README) rather than a real type gap.
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
        userId: req.user?.id,
        total,
        items: { create: orderItems },
        statusHistory: { create: [{ status: "RECIBIDO" }] },
      },
      include: { student: true, items: { include: { product: true } } },
    });

    const whatsappMessage = buildWhatsAppMessage(order as any);
    // Section 30/33: the number is configurable from Configuración → WhatsApp,
    // not hardcoded — env.WHATSAPP_NUMBER is only the fallback for a fresh DB.
    const whatsappNumber = await getSettingValue("whatsapp.number", env.WHATSAPP_NUMBER);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    res.status(201).json({ order, whatsappMessage, whatsappUrl, mode: env.WHATSAPP_MODE });
  })
);

router.put(
  "/:id/status",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(z.object({ status: z.enum(["RECIBIDO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"]), notes: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new ApiError(404, "Pedido no encontrado");

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        statusHistory: { create: [{ status: req.body.status, notes: req.body.notes }] },
      },
    });

    // Confirmed/delivered orders generate a Sale record feeding income reports.
    if (req.body.status === "ENTREGADO") {
      const existingSale = await prisma.sale.findUnique({ where: { orderId: order.id } });
      if (!existingSale) {
        const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
        await prisma.sale.create({
          data: {
            orderId: order.id,
            date: new Date(),
            total: order.total,
            items: {
              create: items.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
              })),
            },
          },
        });
      }
    }

    res.json(updated);
  })
);

export default router;
