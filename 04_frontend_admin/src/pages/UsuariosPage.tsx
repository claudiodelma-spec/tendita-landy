import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { usersService } from "../services/usersService";
import type { AdminUser, RoleName } from "../types/users";

const ROLES: RoleName[] = ["ADMINISTRADOR", "GESTION", "OPERADOR", "PADRE"];

// Section 6/7 — Administración → Usuarios: crear, listar, activar/desactivar,
// asignar roles (que a su vez determinan los permisos vía services/permissions.ts).
export function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleNames: ["OPERADOR"] as RoleName[] });

  function load() {
    usersService.list().then(setUsers);
  }
  useEffect(load, []);

  function toggleRole(role: RoleName) {
    setForm((f) =>
      f.roleNames.includes(role)
        ? { ...f, roleNames: f.roleNames.filter((r) => r !== role) }
        : { ...f, roleNames: [...f.roleNames, role] }
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await usersService.create(form);
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", roleNames: ["OPERADOR"] });
      load();
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el usuario");
    }
  }

  async function toggleActive(user: AdminUser) {
    await usersService.setActive(user.id, !user.active);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Usuarios</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      <Card>
        <DataTable
          rows={users}
          emptyMessage="Aún no hay usuarios."
          columns={[
            { header: "Nombre", render: (u) => u.name },
            { header: "Correo", render: (u) => u.email },
            { header: "Roles", render: (u) => u.roles.join(", ") },
            {
              header: "Estado",
              render: (u) => (
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {u.active ? "Activo" : "Inactivo"}
                </button>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} title="Nuevo usuario" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <input
            required
            placeholder="Nombre"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Correo"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div>
            <p className="text-xs text-slate-500 mb-1">Roles</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    form.roleNames.includes(role)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
