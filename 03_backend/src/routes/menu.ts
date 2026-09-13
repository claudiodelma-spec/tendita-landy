import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

const createSchema = z.object({
  date: z.coerce.date(),
  active: z.boolean().optional(),
  items: z.array(z.object({ label: z.string().min(1), emoji: z.string().optional(), order: z.number().int().optional() })),
});

router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await prisma.dailyMenu.findMany({ include: { items: true }, orderBy: { date: "desc" } }));
  })
);

// TEST 09: the menu for a given calendar date, used by the parent store home.
router.get(
  "/today",
  requireAuth,
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

router.post(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { date, active, items } = req.body;
    const menu = await prisma.dailyMenu.create({
      data: { date, active: active ?? true, items: { create: items } },
      include: { items: true },
    });
    res.status(201).json(menu);
  })
);

router.put(
  "/:id/active",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(z.object({ active: z.boolean() })),
  asyncHandler(async (req, res) => {
    const menu = await prisma.dailyMenu.findUnique({ where: { id: req.params.id } });
    if (!menu) throw new ApiError(404, "Menú no encontrado");
    const updated = await prisma.dailyMenu.update({
      where: { id: req.params.id },
      data: { active: req.body.active },
    });
    res.json(updated);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  asyncHandler(async (req, res) => {
    await prisma.dailyMenuItem.deleteMany({ where: { menuId: req.params.id } });
    await prisma.dailyMenu.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
