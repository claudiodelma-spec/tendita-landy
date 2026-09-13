import { Router } from "express";
import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { computeGoalProgress } from "../services/financeCalculations.js";
import { ApiError } from "../middleware/errorHandler.js";

const periodicity = z.enum(["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO"]);

const router = crudRouter({
  model: prisma.goal,
  moduleName: "Goal",
  createSchema: z.object({
    name: z.string().min(1),
    type: periodicity,
    targetValue: z.number().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    currentValue: z.number().min(0).optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "INACTIVE"]).optional(),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

// BN-005: progress endpoint (objetivo, acumulado, faltante, %, necesidad diaria).
router.get(
  "/:id/progress",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id } });
    if (!goal) throw new ApiError(404, "Meta no encontrada");
    const progress = computeGoalProgress(goal.targetValue, goal.currentValue, goal.endDate);
    res.json({ goal, ...progress });
  })
);

export default router;
