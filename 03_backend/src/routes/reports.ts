import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { computeDailySavingsNeeded } from "../services/financeCalculations.js";

const router = Router();

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-start week
  return startOfDay(new Date(d.getTime() - diff * 24 * 60 * 60 * 1000));
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Section 8/9: the single aggregate endpoint the admin Dashboard renders from.
router.get(
  "/dashboard",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const [salesToday, salesWeek, salesMonth, expensesToday, studentCount, savingsCalc, goals, vacations] =
      await Promise.all([
        prisma.sale.aggregate({ _sum: { total: true }, where: { date: { gte: todayStart } } }),
        prisma.sale.aggregate({ _sum: { total: true }, where: { date: { gte: weekStart } } }),
        prisma.sale.aggregate({ _sum: { total: true }, where: { date: { gte: monthStart } } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: todayStart }, status: "ACTIVE" } }),
        prisma.student.count(),
        computeDailySavingsNeeded(now),
        prisma.goal.findMany({ where: { status: "ACTIVE" } }),
        prisma.vacationPeriod.findMany(),
      ]);

    const ventasHoy = salesToday._sum.total ?? 0;
    const gastosHoy = expensesToday._sum.amount ?? 0;

    res.json({
      ventasHoy,
      ventasSemana: salesWeek._sum.total ?? 0,
      ventasMes: salesMonth._sum.total ?? 0,
      gananciaNeta: ventasHoy - gastosHoy,
      gastosHoy,
      totalAlumnos: studentCount,
      metas: goals,
      vacaciones: vacations,
      ahorroDiario: savingsCalc,
    });
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
