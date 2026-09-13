export type RoleName = "ADMINISTRADOR" | "GESTION" | "OPERADOR" | "PADRE";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: RoleName[];
}

export interface AuditLogEntry {
  id: string;
  user?: { name: string; email: string } | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  module: string;
  recordId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}
