import { prisma } from "../config/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
}

/**
 * BN-004 — Ahorro diario necesario (cálculo central del dashboard).
 *
 *   pagos_previstos      = renta_activa + nomina_prevista + gastos_previstos
 *   dinero_disponible    = ahorro_acumulado
 *   necesidad_restante   = pagos_previstos + metas_pendientes + fondo_vacaciones_faltante - dinero_disponible
 *   ahorro_diario_necesario = necesidad_restante / dias_restantes
 *
 * Recalculado en cada llamada a partir del estado actual — nunca cacheado,
 * porque cualquier cambio en renta/nómina/gastos/metas/ahorro debe reflejarse
 * de inmediato (regla de la sección 9 del spec).
 */
export async function computeDailySavingsNeeded(referenceDate: Date = new Date()) {
  const [activeRents, activeGoals, activeVacations, savingsRows, expenses] = await Promise.all([
    prisma.rent.findMany({ where: { status: "ACTIVE" } }),
    prisma.goal.findMany({ where: { status: "ACTIVE" } }),
    prisma.vacationPeriod.findMany(),
    prisma.savings.findMany(),
    prisma.expense.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const accumulatedSavings = savingsRows.reduce((sum: number, s: any) => sum + s.amount, 0);

  const rentPrevista = activeRents.reduce((sum: number, r: any) => sum + r.value, 0);
  const gastosPrevistos = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  const metasPendientes = activeGoals.reduce(
    (sum: number, g: any) => sum + Math.max(0, g.targetValue - g.currentValue),
    0
  );

  const vacacionesFaltante = activeVacations.reduce(
    (sum: number, v: any) => sum + Math.max(0, v.targetAmount - v.currentSavings),
    0
  );

  const pagosPrevistos = rentPrevista + gastosPrevistos;
  const necesidadRestante =
    pagosPrevistos + metasPendientes + vacacionesFaltante - accumulatedSavings;

  // Days remaining: to the nearest upcoming goal/vacation end date, else 30 days default.
  const upcomingDates = [
    ...activeGoals.map((g: any) => g.endDate),
    ...activeVacations.map((v: any) => v.startDate),
  ].filter((d: Date) => d.getTime() > referenceDate.getTime());

  const nearestDeadline =
    upcomingDates.length > 0
      ? new Date(Math.min(...upcomingDates.map((d: Date) => d.getTime())))
      : new Date(referenceDate.getTime() + 30 * DAY_MS);

  const diasRestantes = daysBetween(referenceDate, nearestDeadline);
  const ahorroDiarioNecesario = Math.max(0, necesidadRestante / diasRestantes);

  return {
    pagosPrevistos,
    dineroDisponible: accumulatedSavings,
    metasPendientes,
    vacacionesFaltante,
    necesidadRestante,
    diasRestantes,
    ahorroDiarioNecesario: Math.round(ahorroDiarioNecesario * 100) / 100,
  };
}

/** BN-002 — Nómina total prevista a partir de días trabajados marcados. */
export async function computePayrollTotal(periodStart: Date, periodEnd: Date) {
  const days = await prisma.payrollDay.findMany({
    where: { date: { gte: periodStart, lte: periodEnd } },
    include: { employee: true },
  });
  const total = days
    .filter((d: any) => d.worked)
    .reduce((sum: number, d: any) => sum + d.employee.dailySalary, 0);
  return { total, workedDays: days.filter((d: any) => d.worked).length };
}

/** BN-006 — Ahorro diario necesario específico para un fondo de vacaciones. */
export function computeVacationDailySavings(
  targetAmount: number,
  currentSavings: number,
  daysRemaining: number
) {
  const missing = Math.max(0, targetAmount - currentSavings);
  return Math.round((missing / Math.max(1, daysRemaining)) * 100) / 100;
}

/** BN-005 — Progreso de una meta (objetivo, acumulado, faltante, %, necesidad diaria). */
export function computeGoalProgress(
  targetValue: number,
  currentValue: number,
  endDate: Date,
  referenceDate: Date = new Date()
) {
  const missing = Math.max(0, targetValue - currentValue);
  const percent = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
  const daysRemaining = daysBetween(referenceDate, endDate);
  const dailyNeed = Math.round((missing / daysRemaining) * 100) / 100;
  return { missing, percent, daysRemaining, dailyNeed };
}
