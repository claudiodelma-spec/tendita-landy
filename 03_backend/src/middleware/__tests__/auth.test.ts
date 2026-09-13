import { describe, it, expect, vi } from "vitest";
import { requireRole, requirePermission, type AuthUser } from "../auth.js";
import { permissionsForRoles } from "../../services/permissionCatalog.js";

function mockReq(user?: AuthUser) {
  return { user } as any;
}
function mockRes() {
  return {} as any;
}

function runGuard(guard: (req: any, res: any, next: any) => void, user?: AuthUser) {
  const next = vi.fn();
  try {
    guard(mockReq(user), mockRes(), next);
    return { ok: next.mock.calls.length === 1, error: null as any };
  } catch (err: any) {
    return { ok: false, error: err };
  }
}

const admin: AuthUser = { id: "1", email: "admin@demo", roles: ["ADMINISTRADOR"] };
const gestion: AuthUser = { id: "2", email: "gestion@demo", roles: ["GESTION"] };
const operador: AuthUser = { id: "3", email: "operador@demo", roles: ["OPERADOR"] };
const padre: AuthUser = { id: "4", email: "padre@demo", roles: ["PADRE"] };

// TEST 14 — ROLES (sección 41 del spec)
describe("TEST 14 — ROLES", () => {
  it("Administrador tiene acceso completo (todas las rutas protegidas)", () => {
    expect(runGuard(requireRole("ADMINISTRADOR"), admin).ok).toBe(true);
    expect(runGuard(requireRole("ADMINISTRADOR", "GESTION"), admin).ok).toBe(true);
    expect(runGuard(requireRole("ADMINISTRADOR", "OPERADOR"), admin).ok).toBe(true);
    expect(runGuard(requirePermission("settings.manage"), admin).ok).toBe(true);
  });

  it("Gestión NO tiene acceso a configuración crítica (settings)", () => {
    const result = runGuard(requirePermission("settings.manage"), gestion);
    expect(result.ok).toBe(false);
    expect(result.error?.status).toBe(403);
  });

  it("Gestión SÍ tiene acceso a finanzas", () => {
    expect(runGuard(requirePermission("finance.view", "finance.manage"), gestion).ok).toBe(true);
  });

  it("Operador NO tiene acceso financiero", () => {
    const result = runGuard(requirePermission("finance.view"), operador);
    expect(result.ok).toBe(false);
    expect(result.error?.status).toBe(403);
  });

  it("Operador SÍ administra tienda y pedidos", () => {
    expect(runGuard(requirePermission("store.manage"), operador).ok).toBe(true);
    expect(runGuard(requirePermission("orders.manage"), operador).ok).toBe(true);
  });

  it("Padre solamente accede a tienda/pedidos (crear + ver su historial)", () => {
    expect(runGuard(requirePermission("store.view"), padre).ok).toBe(true);
    expect(runGuard(requirePermission("orders.create"), padre).ok).toBe(true);
    expect(runGuard(requirePermission("finance.view"), padre).ok).toBe(false);
    expect(runGuard(requirePermission("store.manage"), padre).ok).toBe(false);
    expect(runGuard(requirePermission("users.manage"), padre).ok).toBe(false);
  });

  it("Un usuario sin roles es rechazado (401) por requireRole", () => {
    const result = runGuard(requireRole("ADMINISTRADOR"), undefined);
    expect(result.ok).toBe(false);
    expect(result.error?.status).toBe(401);
  });

  it("permissionsForRoles combina permisos de múltiples roles sin duplicar", () => {
    const perms = permissionsForRoles(["GESTION", "OPERADOR"]);
    expect(perms).toContain("finance.manage");
    expect(perms).toContain("store.manage");
    expect(new Set(perms).size).toBe(perms.length);
  });
});
