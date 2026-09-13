import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { computePayrollTotal } from "../services/financeCalculations.js";

const router = Router();

// BN-002: mark a day worked/not-worked for an employee.
const markDaySchema = z.object({
  employeeId: z.string(),
  date: z.coerce.date(),
  worked: z.boolean(),
});

router.post(
  "/days",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  validateBody(markDaySchema),
  asyncHandler(async (req, res) => {
    const { employeeId, date, worked } = req.body;
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: "Empleado no encontrado" });

    const amount = worked ? employee.dailySalary : 0;
    const day = await prisma.payrollDay.create({
      data: { employeeId, date, worked, amount },
    });
    res.status(201).json(day);
  })
);

router.get(
  "/total",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const start = req.query.start ? new Date(String(req.query.start)) : new Date();
    const end = req.query.end ? new Date(String(req.query.end)) : new Date();
    const result = await computePayrollTotal(start, end);
    res.json(result);
  })
);

export default router;
