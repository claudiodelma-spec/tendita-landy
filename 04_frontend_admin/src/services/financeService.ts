import { api } from "./apiClient";
import type {
  Rent,
  Employee,
  Expense,
  ExpenseCategory,
  Goal,
  GoalProgress,
  Savings,
  VacationPeriod,
  DashboardSummary,
} from "../types/finance";

// Section 44 endpoints — one function per resource, thin wrappers over `api`.
export const financeService = {
  // Dashboard (corrección "Dashboard financiero" — acepta fecha para histórico)
  getDashboard: (date?: string) => api.get<DashboardSummary>(`/reports/dashboard${date ? `?date=${date}` : ""}`),

  // Ventas del día (manual, upsert por día — sección 2 de la corrección)
  getIncomeForDate: (date: string) => api.get<{ id: string; amount: number; notes?: string } | null>(`/income?date=${date}`),
  upsertIncome: (date: string, amount: number, notes?: string) => api.post<any>("/income", { date, amount, notes }),

  // Gastos del día (manual, upsert por día — sección 3 de la corrección)
  getDailyExpenseForDate: (date: string) =>
    api.get<{ id: string; amount: number; notes?: string } | null>(`/daily-expenses?date=${date}`),
  upsertDailyExpense: (date: string, amount: number, notes?: string) =>
    api.post<any>("/daily-expenses", { date, amount, notes }),

  // Renta (BN-001)
  listRents: () => api.get<Rent[]>("/rent"),
  createRent: (data: Partial<Rent>) => api.post<Rent>("/rent", data),
  updateRent: (id: string, data: Partial<Rent>) => api.put<Rent>(`/rent/${id}`, data),
  deleteRent: (id: string) => api.del<void>(`/rent/${id}`),

  // Nómina (BN-002)
  listEmployees: () => api.get<Employee[]>("/employees"),
  createEmployee: (data: Partial<Employee>) => api.post<Employee>("/employees", data),
  updateEmployee: (id: string, data: Partial<Employee>) => api.put<Employee>(`/employees/${id}`, data),
  markPayrollDay: (employeeId: string, date: string, worked: boolean) =>
    api.post("/payroll/days", { employeeId, date, worked }),
  getPayrollTotal: (start: string, end: string) =>
    api.get<{ total: number; workedDays: number }>(`/payroll/total?start=${start}&end=${end}`),

  // Gastos (BN-003)
  listExpenses: () => api.get<Expense[]>("/expenses"),
  createExpense: (data: Partial<Expense>) => api.post<Expense>("/expenses", data),
  updateExpense: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.del<void>(`/expenses/${id}`),
  listExpenseCategories: () => api.get<ExpenseCategory[]>("/expenses/categories"),
  createExpenseCategory: (name: string) => api.post<ExpenseCategory>("/expenses/categories", { name }),

  // Metas (BN-005)
  listGoals: () => api.get<Goal[]>("/goals"),
  createGoal: (data: Partial<Goal>) => api.post<Goal>("/goals", data),
  updateGoal: (id: string, data: Partial<Goal>) => api.put<Goal>(`/goals/${id}`, data),
  getGoalProgress: (id: string) => api.get<GoalProgress>(`/goals/${id}/progress`),

  // Ahorro
  listSavings: () => api.get<Savings[]>("/savings"),
  createSaving: (data: Partial<Savings>) => api.post<Savings>("/savings", data),

  // Vacaciones (BN-006)
  listVacations: () => api.get<VacationPeriod[]>("/vacations"),
  createVacation: (data: Partial<VacationPeriod>) => api.post<VacationPeriod>("/vacations", data),
  updateVacation: (id: string, data: Partial<VacationPeriod>) =>
    api.put<VacationPeriod>(`/vacations/${id}`, data),
  getVacationDailyNeed: (id: string) =>
    api.get<{ vacation: VacationPeriod; daysRemaining: number; dailyNeed: number }>(
      `/vacations/${id}/daily-need`
    ),
};
