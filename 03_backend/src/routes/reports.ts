import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  computeDashboardSummary,
  computeOperationalDailyNeed,
  computeProfitGoal,
  computeEvolution,
  computeWeeklySummary,
} from "../services/financeCalculations.js";

const router = Router();

// Corrección "Dashboard financiero" + ajuste posterior del usuario:
// - resumen del día + objetivo de ahorro/vacaciones (sección 1, sin cambios)
// - gastosOperativos: Ahorro para cubrir Renta+Nómina+Gastos (revive BN-004
//   de forma más simple — "cuánto tengo que juntar por día para llegar a
//   todos los gastos")
// - metaGanancia: nuevo — margen de ganancia configurable y progreso real
router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    const [summary, gastosOperativos, metaGanancia] = await Promise.all([
      computeDashboardSummary(date),
      computeOperationalDailyNeed(date),
      computeProfitGoal(date),
    ]);
    res.json({ ...summary, gastosOperativos, metaGanancia });
  })
);

// Evolución semanal/mensual + histórico (Ventas/Gastos/Ganancia día por día).
router.get(
  "/evolution",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const range = String(req.query.range ?? "week"); // week | month | history
    const days = range === "month" ? 30 : range === "history" ? 90 : 7;
    const series = await computeEvolution(days);
    res.json({ range, series });
  })
);

// Corte semanal — tablero de Ventas/Gastos/Ganancia por semana.
router.get(
  "/weekly-summary",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const weeksCount = req.query.weeks ? Number(req.query.weeks) : 8;
    const weeks = await computeWeeklySummary(weeksCount);
    res.json({ weeks });
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
