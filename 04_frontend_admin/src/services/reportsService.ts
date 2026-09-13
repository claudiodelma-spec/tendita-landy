import { api } from "./apiClient";

interface SaleRow {
  id: string;
  date: string;
  total: number;
}
interface ExpenseRow {
  id: string;
  concept: string;
  amount: number;
  date: string;
  periodicity: string;
  category?: { name: string };
}
interface FinancialSummary {
  ingresos: number;
  gastos: number;
  ganancia: number;
}
interface OrdersByStatus {
  status: string;
  _count: { _all: number };
  _sum: { total: number | null };
}
interface GoalRow {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
}
interface SavingsRow {
  id: string;
  label: string;
  amount: number;
  date: string;
}
interface VacationRow {
  id: string;
  name: string;
  targetAmount: number;
  currentSavings: number;
}

export const reportsService = {
  getSales: () => api.get<{ granularity: string; sales: SaleRow[] }>("/reports/sales"),
  getExpenses: () => api.get<ExpenseRow[]>("/reports/expenses"),
  getFinancial: () => api.get<FinancialSummary>("/reports/financial"),
  getOrders: () => api.get<OrdersByStatus[]>("/reports/orders"),
  getGoals: () => api.get<GoalRow[]>("/reports/goals"),
  getSavings: () => api.get<SavingsRow[]>("/reports/savings"),
  getVacations: () => api.get<VacationRow[]>("/reports/vacations"),
};
