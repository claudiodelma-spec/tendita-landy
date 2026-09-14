import { prisma } from "../config/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
}

function normalizeToDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Corrección "Dashboard financiero" (spec adicional) — reemplaza el cálculo
 * que usaba el Dashboard (no las páginas de Metas/Vacaciones individuales,
 * que siguen usando computeGoalProgress/computeVacationDailySavings sin
 * cambios).
 *
 * VENTAS DEL DÍA (manual, modelo Income) - GASTOS DEL DÍA (manual, modelo
 * DailyExpense) = GANANCIA NETA.
 * OBJETIVO PRINCIPAL (Setting) + FONDO VACACIONES (Setting) = OBJETIVO TOTAL.
 * OBJETIVO TOTAL - AHORRO ACUMULADO (suma real de Savings) = FALTA AHORRAR.
 * FALTA AHORRAR / DÍAS RESTANTES (hasta Setting savings.targetEndDate) =
 * AHORRO DIARIO NECESARIO.
 */
export async function computeDashboardSummary(referenceDate: Date = new Date()) {
  const day = normalizeToDay(referenceDate);

  const [incomeRow, expenseRow, savingsRows, settings] = await Promise.all([
    prisma.income.findUnique({ where: { date: day } }),
    prisma.dailyExpense.findUnique({ where: { date: day } }),
    prisma.savings.findMany(),
    prisma.setting.findMany({
      where: { key: { in: ["savings.mainGoal", "savings.vacationFund", "savings.targetStartDate", "savings.targetEndDate"] } },
    }),
  ]);

  const settingValue = (key: string, fallback: string) =>
    settings.find((s: any) => s.key === key)?.value ?? fallback;

  const ventasDia = incomeRow?.amount ?? 0;
  const gastosDia = expenseRow?.amount ?? 0;
  const gananciaNeta = ventasDia - gastosDia;

  const objetivoPrincipal = Number(settingValue("savings.mainGoal", "0")) || 0;
  const fondoVacaciones = Number(settingValue("savings.vacationFund", "0")) || 0;
  const objetivoTotal = objetivoPrincipal + fondoVacaciones;

  const ahorroAcumulado = savingsRows.reduce((sum: number, s: any) => sum + s.amount, 0);
  const faltaAhorrar = Math.max(0, objetivoTotal - ahorroAcumulado);
  const progreso = objetivoTotal > 0 ? Math.min(100, (ahorroAcumulado / objetivoTotal) * 100) : 0;

  const targetEndDateStr = settingValue("savings.targetEndDate", "");
  const targetEndDate = targetEndDateStr ? new Date(targetEndDateStr) : null;

  let diasRestantes = 0;
  let objetivoVencido = false;
  if (targetEndDate) {
    const msRemaining = targetEndDate.getTime() - day.getTime();
    diasRestantes = Math.max(0, Math.ceil(msRemaining / DAY_MS));
    if (msRemaining < 0 && faltaAhorrar > 0) objetivoVencido = true;
  }

  const ahorroDiarioNecesario =
    diasRestantes > 0 ? Math.round((faltaAhorrar / diasRestantes) * 100) / 100 : faltaAhorrar > 0 ? faltaAhorrar : 0;

  // Sección 8 — comparación ganancia neta vs. ahorro necesario (nunca ahorra automáticamente).
  const ahorroRecomendado = Math.max(0, Math.min(gananciaNeta, ahorroDiarioNecesario));
  const disponibleDespues = Math.max(0, gananciaNeta - ahorroDiarioNecesario);
  const deficit = Math.max(0, ahorroDiarioNecesario - gananciaNeta);

  return {
    fecha: day.toISOString().slice(0, 10),
    ventasDia,
    gastosDia,
    gananciaNeta,
    objetivoPrincipal,
    fondoVacaciones,
    objetivoTotal,
    ahorroAcumulado,
    faltaAhorrar,
    progreso: Math.round(progreso * 10) / 10,
    ahorroDiarioNecesario,
    diasRestantes,
    objetivoVencido,
    ahorroRecomendado,
    disponibleDespues,
    deficit,
  };
}


/**
 * BN-004 — Ahorro diario necesario (cálculo central del dashboard, ANTES de
 * la corrección "Dashboard financiero" pedida por el usuario).
 *
 * NOTA: /api/reports/dashboard ahora usa computeDashboardSummary() (arriba),
 * con la fórmula simplificada de esa corrección. Esta función se conserva
 * intacta — no se usa en ningún endpoint hoy, pero no se elimina para no
 * perder la lógica ni romper nada que pueda depender de ella más adelante.
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
