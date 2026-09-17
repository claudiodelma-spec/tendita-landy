import { api } from "./apiClient";
import type { AdminUser, AuditLogEntry, RoleName } from "../types/users";

export const usersService = {
  list: () => api.get<AdminUser[]>("/users"),
  create: (data: { name: string; email: string; password: string; roleNames: RoleName[] }) =>
    api.post<{ id: string; name: string; email: string }>("/users", data),
  update: (id: string, data: { name?: string; roleNames?: RoleName[] }) => api.put<AdminUser>(`/users/${id}`, data),
  remove: (id: string) => api.del<void>(`/users/${id}`),
  setActive: (id: string, active: boolean) => api.put<{ id: string; active: boolean }>(`/users/${id}/active`, { active }),
};

export const auditService = {
  list: (moduleFilter?: string) => api.get<AuditLogEntry[]>(`/audit${moduleFilter ? `?module=${moduleFilter}` : ""}`),
};
