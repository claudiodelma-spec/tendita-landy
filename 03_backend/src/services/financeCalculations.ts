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
 * NUEVO — "Ahorro para gastos operativos": cuánto necesito generar/ahorrar
 * por día para cubrir Renta + Nómina + Gastos (los 3 fusionados en una sola
 * pantalla de administración). Pedido explícito del usuario para separar
 * este cálculo del objetivo de ahorro/vacaciones (que sigue usando
 * computeDashboardSummary sin cambios).
 */
// Semana laboral de 5 días (lunes a viernes) — la escuela no opera fin de
// semana, así que el reparto diario debe hacerse entre 5 días, no 7.
const WORK_DAYS_PER_WEEK = 5;

function weeklyEquivalent(amount: number, periodicity: string): number {
  switch (periodicity) {
    case "DIARIO":
      return amount * WORK_DAYS_PER_WEEK;
    case "SEMANAL":
      return amount;
    case "MENSUAL":
      return (amount * 12) / 52;
    case "ANUAL":
      return amount / 52;
    default: // PERSONALIZADO / EXTRAORDINARIO — se cuenta esta semana tal cual
      return amount;
  }
}

export async function computeOperationalDailyNeed(referenceDate: Date = new Date()) {
  const day = normalizeToDay(referenceDate);
  const fiveDaysAgo = new Date(day.getTime() - (WORK_DAYS_PER_WEEK - 1) * DAY_MS);

  const [activeRents, activeExpenses, employees, dailyExpenses] = await Promise.all([
    prisma.rent.findMany({ where: { status: "ACTIVE" } }),
    prisma.expense.findMany({ where: { status: "ACTIVE" } }),
    prisma.employee.findMany({ where: { active: true } }),
    // "Gastos del día" (Resumen del día) de los últimos 5 días laborales.
    prisma.dailyExpense.findMany({ where: { date: { gte: fiveDaysAgo, lte: day } } }),
  ]);

  const rentaSemanal = activeRents.reduce((sum: number, r: any) => sum + weeklyEquivalent(r.value, r.periodicity), 0);
  const gastosFijosSemanal = activeExpenses.reduce(
    (sum: number, e: any) => sum + weeklyEquivalent(e.amount, e.periodicity),
    0
  );
  const gastosDiaSemanal = dailyExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const nominaSemanal = employees.reduce((sum: number, e: any) => sum + e.dailySalary * WORK_DAYS_PER_WEEK, 0);

  const pagosSemanales = rentaSemanal + nominaSemanal + gastosFijosSemanal + gastosDiaSemanal;
  const ahorroDiarioNecesario = Math.round((pagosSemanales / WORK_DAYS_PER_WEEK) * 100) / 100;
  const rentaDiaria = Math.round((rentaSemanal / WORK_DAYS_PER_WEEK) * 100) / 100;

  return {
    rentaSemanal: Math.round(rentaSemanal * 100) / 100,
    rentaDiaria,
    nominaSemanal: Math.round(nominaSemanal * 100) / 100,
    gastosFijosSemanal: Math.round(gastosFijosSemanal * 100) / 100,
    gastosDiaSemanal: Math.round(gastosDiaSemanal * 100) / 100,
    pagosSemanales: Math.round(pagosSemanales * 100) / 100,
    ahorroDiarioNecesario,
  };
}

/**
 * NUEVO — "Ahorro para vacaciones": el usuario pidió sacar del Dashboard el
 * cartón antiguo basado en Settings (Objetivo principal + Fondo vacaciones)
 * y mostrar en su lugar una regla real basada en los periodos de vacaciones
 * que administra en la pantalla Vacaciones (VacationPeriod, sin cambios ahí).
 * Toma el periodo próximo/activo más cercano.
 */
export async function computeVacationDashboardCard(referenceDate: Date = new Date()) {
  const periods = await prisma.vacationPeriod.findMany({ orderBy: { startDate: "asc" } });
  const upcoming = periods.find((p: any) => new Date(p.startDate).getTime() >= referenceDate.getTime()) ?? periods[0];

  if (!upcoming) {
    return { hasPeriod: false as const };
  }

  const daysUntilStart = Math.max(
    1,
    Math.ceil((new Date(upcoming.startDate).getTime() - referenceDate.getTime()) / DAY_MS)
  );
  const dailyNeed = computeVacationDailySavings(upcoming.targetAmount, upcoming.currentSavings, daysUntilStart);
  const faltante = Math.max(0, upcoming.targetAmount - upcoming.currentSavings);

  return {
    hasPeriod: true as const,
    id: upcoming.id,
    name: upcoming.name,
    startDate: upcoming.startDate,
    endDate: upcoming.endDate,
    targetAmount: upcoming.targetAmount,
    currentSavings: upcoming.currentSavings,
    faltante: Math.round(faltante * 100) / 100,
    diasRestantes: daysUntilStart,
    ahorroDiarioNecesario: dailyNeed,
  };
}


/**
 * NUEVO — "Meta de ganancia": el usuario configura cuánto quiere ganar
 * (Setting finance.profitGoal + fechas), el sistema calcula la ganancia neta
 * acumulada real (Ventas - Gastos del día, sumadas desde la fecha de inicio)
 * y cuánto falta ganar por día para llegar a la meta.
 */
export async function computeProfitGoal(referenceDate: Date = new Date()) {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["finance.profitGoal", "finance.profitGoalStartDate", "finance.profitGoalEndDate"] } },
  });
  const settingValue = (key: string, fallback: string) =>
    settings.find((s: any) => s.key === key)?.value ?? fallback;

  const profitGoal = Number(settingValue("finance.profitGoal", "0")) || 0;
  const startDateStr = settingValue("finance.profitGoalStartDate", "");
  const endDateStr = settingValue("finance.profitGoalEndDate", "");
  const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
  const endDate = endDateStr ? new Date(endDateStr) : null;

  const [incomeRows, expenseRows] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: startDate, lte: referenceDate } } }),
    prisma.dailyExpense.findMany({ where: { date: { gte: startDate, lte: referenceDate } } }),
  ]);

  const totalVentas = incomeRows.reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalGastos = expenseRows.reduce((sum: number, r: any) => sum + r.amount, 0);
  const gananciaAcumulada = totalVentas - totalGastos;

  const faltante = Math.max(0, profitGoal - gananciaAcumulada);
  const progreso = profitGoal > 0 ? Math.min(100, (gananciaAcumulada / profitGoal) * 100) : 0;

  let diasRestantes = 0;
  let metaVencida = false;
  if (endDate) {
    const msRemaining = endDate.getTime() - referenceDate.getTime();
    diasRestantes = Math.max(0, Math.ceil(msRemaining / DAY_MS));
    if (msRemaining < 0 && faltante > 0) metaVencida = true;
  }
  const gananciaDiariaNecesaria =
    diasRestantes > 0 ? Math.round((faltante / diasRestantes) * 100) / 100 : faltante > 0 ? faltante : 0;

  return {
    profitGoal,
    gananciaAcumulada: Math.round(gananciaAcumulada * 100) / 100,
    faltante: Math.round(faltante * 100) / 100,
    progreso: Math.round(progreso * 10) / 10,
    diasRestantes,
    metaVencida,
    gananciaDiariaNecesaria,
  };
}

/**
 * NUEVO — Evolución histórica (sección "que en el dash muestre la evolución,
 * semanal, mensual y historial"). Devuelve Ventas/Gastos/Ganancia día por
 * día para los últimos `days` días, tomando los registros manuales
 * (Income/DailyExpense) — días sin registro cuentan como $0, no se inventan.
 */
export async function computeEvolution(days: number, referenceDate: Date = new Date()) {
  const end = normalizeToDay(referenceDate);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);

  const [incomeRows, expenseRows] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.dailyExpense.findMany({ where: { date: { gte: start, lte: end } } }),
  ]);

  const incomeByDate = new Map(incomeRows.map((r: any) => [r.date.toISOString().slice(0, 10), r]));
  const expenseByDate = new Map(expenseRows.map((r: any) => [r.date.toISOString().slice(0, 10), r]));

  const series: {
    fecha: string;
    ventas: number;
    gastos: number;
    ganancia: number;
    incomeId: string | null;
    dailyExpenseId: string | null;
  }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const incomeRow = incomeByDate.get(key) as any;
    const expenseRow = expenseByDate.get(key) as any;
    const ventas = incomeRow?.amount ?? 0;
    const gastos = expenseRow?.amount ?? 0;
    series.push({
      fecha: key,
      ventas,
      gastos,
      ganancia: ventas - gastos,
      incomeId: incomeRow?.id ?? null,
      dailyExpenseId: expenseRow?.id ?? null,
    });
  }
  return series;
}

/**
 * NUEVO — "Corte semanal": tablero pedido por el usuario para ver, semana a
 * semana, Ventas/Gastos/Ganancia reales — y comparar contra la Meta de
 * ganancia y el Ahorro operativo actuales (sección "cuánto tengo que juntar
 * por día para llegar a mis metas").
 */
export async function computeWeeklySummary(weeksCount: number = 8, referenceDate: Date = new Date()) {
  const today = normalizeToDay(referenceDate);
  // Lunes de la semana actual.
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const currentMonday = new Date(today.getTime() - diffToMonday * DAY_MS);

  const rangeStart = new Date(currentMonday.getTime() - (weeksCount - 1) * 7 * DAY_MS);

  const [incomeRows, expenseRows] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: rangeStart, lte: today } } }),
    prisma.dailyExpense.findMany({ where: { date: { gte: rangeStart, lte: today } } }),
  ]);

  const weeks: {
    weekStart: string;
    weekEnd: string;
    ventas: number;
    gastos: number;
    ganancia: number;
  }[] = [];

  for (let w = 0; w < weeksCount; w++) {
    const weekStart = new Date(rangeStart.getTime() + w * 7 * DAY_MS);
    const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);
    const ventas = incomeRows
      .filter((r: any) => r.date >= weekStart && r.date <= weekEnd)
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    const gastos = expenseRows
      .filter((r: any) => r.date >= weekStart && r.date <= weekEnd)
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    weeks.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      ventas: Math.round(ventas * 100) / 100,
      gastos: Math.round(gastos * 100) / 100,
      ganancia: Math.round((ventas - gastos) * 100) / 100,
    });
  }

  return weeks;
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
