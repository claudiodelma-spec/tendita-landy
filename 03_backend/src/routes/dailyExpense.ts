import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

function normalizeToDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Corrección "Dashboard financiero", sección 3 — "Gastos del día": ingreso
// manual, un único registro consolidado por día. Modelo NUEVO (DailyExpense),
// deliberadamente separado de Expense (la lista categorizada que usan las
// pantallas Gastos y Reportes) para no mezclar ambos conceptos.
const upsertSchema = z.object({
  date: z.coerce.date(),
  amount: z.number().min(0, "No se permiten valores negativos"),
  notes: z.string().optional(),
});

router.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    if (req.query.date) {
      const day = normalizeToDay(new Date(String(req.query.date)));
      const row = await prisma.dailyExpense.findUnique({ where: { date: day } });
      return res.json(row);
    }
    const rows = await prisma.dailyExpense.findMany({ orderBy: { date: "desc" } });
    res.json(rows);
  })
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => {
    const day = normalizeToDay(req.body.date);
    const existing = await prisma.dailyExpense.findUnique({ where: { date: day } });

    const row = await prisma.dailyExpense.upsert({
      where: { date: day },
      update: { amount: req.body.amount, notes: req.body.notes, registeredById: req.user?.id },
      create: {
        date: day,
        amount: req.body.amount,
        notes: req.body.notes,
        registeredById: req.user?.id,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: existing ? "UPDATE" : "CREATE",
      module: "DailyExpense",
      recordId: row.id,
      oldValue: existing ? { amount: existing.amount } : undefined,
      newValue: { amount: row.amount, date: row.date },
    });

    res.status(existing ? 200 : 201).json(row);
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const before = await prisma.dailyExpense.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: "Registro no encontrado" });
    await prisma.dailyExpense.delete({ where: { id: req.params.id } });
    await logAudit({ userId: req.user?.id, action: "DELETE", module: "DailyExpense", recordId: req.params.id, oldValue: before });
    res.status(204).send();
  })
);

export default router;
