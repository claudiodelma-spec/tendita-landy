import { Router } from "express";
import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { computeVacationDailySavings } from "../services/financeCalculations.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = crudRouter({
  model: prisma.vacationPeriod,
  moduleName: "VacationPeriod",
  createSchema: z.object({
    name: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    days: z.number().int().positive(),
    targetAmount: z.number().positive(),
    currentSavings: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

// BN-006: daily savings needed for a specific vacation fund.
router.get(
  "/:id/daily-need",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = await prisma.vacationPeriod.findUnique({ where: { id: req.params.id } });
    if (!v) throw new ApiError(404, "Periodo vacacional no encontrado");
    const daysRemaining = Math.max(
      1,
      Math.ceil((v.startDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );
    const dailyNeed = computeVacationDailySavings(v.targetAmount, v.currentSavings, daysRemaining);
    res.json({ vacation: v, daysRemaining, dailyNeed });
  })
);

export default router;
