import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeDashboardSummary } from "../services/financeCalculations.js";

const router = Router();

// Corrección "Dashboard financiero" — únicamente los 7 indicadores pedidos
// (sección 1), sin Total alumnos. Acepta ?date=YYYY-MM-DD para consultar
// días anteriores (sección 16 — histórico).
router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    const summary = await computeDashboardSummary(date);
    res.json(summary);
  })
);

router.get(
  "/sales",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const { granularity } = req.query; // diario|semanal|mensual|anual
    const sales = await prisma.sale.findMany({ orderBy: { date: "asc" } });
    res.json({ granularity: granularity ?? "diario", sales });
  })
);

router.get(
  "/expenses",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    const expenses = await prisma.expense.findMany({ include: { category: true } });
    res.json(expenses);
  })
);

router.get(
  "/financial",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    const [incomeSum, expenseSum] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: "ACTIVE" } }),
    ]);
    const ingresos = incomeSum._sum.total ?? 0;
    const gastos = expenseSum._sum.amount ?? 0;
    res.json({ ingresos, gastos, ganancia: ingresos - gastos });
  })
);

router.get(
  "/orders",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION", "OPERADOR"),
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.order.groupBy({ by: ["status"], _count: { _all: true }, _sum: { total: true } });
    res.json(grouped);
  })
);

router.get(
  "/goals",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    res.json(await prisma.goal.findMany());
  })
);

router.get(
  "/savings",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    res.json(await prisma.savings.findMany());
  })
);

router.get(
  "/vacations",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    res.json(await prisma.vacationPeriod.findMany());
  })
);

export default router;
