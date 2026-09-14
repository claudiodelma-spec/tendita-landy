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

export interface DashboardSummary {
  fecha: string;
  ventasDia: number;
  gastosDia: number;
  gananciaNeta: number;
  objetivoPrincipal: number;
  fondoVacaciones: number;
  objetivoTotal: number;
  ahorroAcumulado: number;
  faltaAhorrar: number;
  progreso: number;
  ahorroDiarioNecesario: number;
  diasRestantes: number;
  objetivoVencido: boolean;
  ahorroRecomendado: number;
  disponibleDespues: number;
  deficit: number;
}
