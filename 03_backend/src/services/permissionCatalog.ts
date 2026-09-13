// Pure permission catalog + role→permission mapping (section 6 access matrix).
// Deliberately has NO dependency on Prisma or any I/O so it can be unit
// tested and evaluated at JWT-issue time without a database round trip.

export const PERMISSIONS: { key: string; label: string }[] = [
  { key: "dashboard.view", label: "Ver dashboard" },
  { key: "finance.view", label: "Ver gestión financiera" },
  { key: "finance.manage", label: "Editar renta/nómina/gastos/metas/ahorro/vacaciones" },
  { key: "store.view", label: "Ver productos/categorías/menú/carrusel" },
  { key: "store.manage", label: "Editar productos/categorías/menú/carrusel" },
  { key: "orders.view", label: "Ver pedidos" },
  { key: "orders.manage", label: "Cambiar estado de pedidos" },
  { key: "orders.create", label: "Crear pedidos (tienda)" },
  { key: "reports.view", label: "Ver reportes" },
  { key: "users.manage", label: "Administrar usuarios y roles" },
  { key: "settings.manage", label: "Administrar configuración del sistema" },
  { key: "audit.view", label: "Ver auditoría" },
];

// Section 6 access matrix.
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRADOR: PERMISSIONS.map((p) => p.key), // acceso completo
  GESTION: ["dashboard.view", "finance.view", "finance.manage", "reports.view"],
  OPERADOR: ["store.view", "store.manage", "orders.view", "orders.manage"],
  PADRE: ["store.view", "orders.create", "orders.view"],
};

/** Flattens a user's roles into the set of permission keys they hold. */
export function permissionsForRoles(roleNames: string[]): string[] {
  const set = new Set<string>();
  for (const role of roleNames) {
    for (const key of ROLE_PERMISSIONS[role] ?? []) set.add(key);
  }
  return Array.from(set);
}
