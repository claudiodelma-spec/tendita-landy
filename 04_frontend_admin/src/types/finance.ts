export type Periodicity = "DIARIO" | "SEMANAL" | "MENSUAL" | "ANUAL" | "PERSONALIZADO" | "EXTRAORDINARIO";
export type ActiveStatus = "ACTIVE" | "INACTIVE";

export interface Rent {
  id: string;
  concept?: string;
  value: number;
  periodicity: Periodicity;
  startDate: string;
  endDate?: string | null;
  status: ActiveStatus;
  notes?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  dailySalary: number;
  active: boolean;
  startDate: string;
  endDate?: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  concept: string;
  categoryId: string;
  category?: ExpenseCategory;
  amount: number;
  date: string;
  periodicity: Periodicity;
  description?: string | null;
  status: ActiveStatus;
}

export interface Goal {
  id: string;
  name: string;
  type: Periodicity;
  targetValue: number;
  startDate: string;
  endDate: string;
  currentValue: number;
  status: "ACTIVE" | "COMPLETED" | "INACTIVE";
  notes?: string | null;
}

export interface GoalProgress {
  goal: Goal;
  missing: number;
  percent: number;
  daysRemaining: number;
  dailyNeed: number;
}

export interface Savings {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: "INICIAL" | "DIARIO" | "SEMANAL" | "MENSUAL" | "EXTRAORDINARIO";
  notes?: string | null;
}

export interface VacationPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: number;
  targetAmount: number;
  currentSavings: number;
  notes?: string | null;
}

export interface DailySavingsCalc {
  pagosPrevistos: number;
  dineroDisponible: number;
  metasPendientes: number;
  vacacionesFaltante: number;
  necesidadRestante: number;
  diasRestantes: number;
  ahorroDiarioNecesario: number;
}

export interface DashboardSummary {
  ventasHoy: number;
  ventasSemana: number;
  ventasMes: number;
  gananciaNeta: number;
  gastosHoy: number;
  totalAlumnos: number;
  metas: Goal[];
  vacaciones: VacationPeriod[];
  ahorroDiario: DailySavingsCalc;
}
