import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const imageSchema = z.object({
  imageUrl: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  displaySeconds: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const carousel = await prisma.carousel.findFirst({
      include: { images: { orderBy: { order: "asc" } } },
    });
    res.json(carousel);
  })
);

router.post(
  "/images",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(imageSchema),
  asyncHandler(async (req, res) => {
    let carousel = await prisma.carousel.findFirst();
    if (!carousel) carousel = await prisma.carousel.create({ data: { maxSlots: 5 } });

    // Section 23: max 5 active images.
    const activeCount = await prisma.carouselImage.count({
      where: { carouselId: carousel.id, active: true },
    });
    if (activeCount >= carousel.maxSlots) {
      throw new ApiError(400, `Máximo de ${carousel.maxSlots} imágenes activas alcanzado`);
    }

    const image = await prisma.carouselImage.create({
      data: { ...req.body, carouselId: carousel.id },
    });
    res.status(201).json(image);
  })
);

router.put(
  "/images/:id",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(imageSchema.partial()),
  asyncHandler(async (req, res) => {
    const image = await prisma.carouselImage.findUnique({ where: { id: req.params.id } });
    if (!image) throw new ApiError(404, "Imagen no encontrada");
    const updated = await prisma.carouselImage.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  })
);

router.delete(
  "/images/:id",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  asyncHandler(async (req, res) => {
    await prisma.carouselImage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
