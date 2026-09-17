import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { usersService } from "../services/usersService";
import type { AdminUser, RoleName } from "../types/users";

const ROLES: RoleName[] = ["ADMINISTRADOR", "GESTION", "OPERADOR", "PADRE"];

function IconBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button onClick={onClick} title={title} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
      {children}
    </button>
  );
}
function confirmDelete(label: string) {
  return window.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`);
}

// Section 6/7 — Administración → Usuarios: crear, listar, editar, eliminar,
// activar/desactivar, asignar roles (que determinan los permisos).
export function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleNames: ["OPERADOR"] as RoleName[] });

  function load() {
    usersService.list().then(setUsers);
  }
  useEffect(load, []);

  function toggleRole(role: RoleName) {
    setForm((f) =>
      f.roleNames.includes(role) ? { ...f, roleNames: f.roleNames.filter((r) => r !== role) } : { ...f, roleNames: [...f.roleNames, role] }
    );
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", roleNames: ["OPERADOR"] });
    setModalOpen(true);
  }
  function openEdit(u: AdminUser) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", roleNames: u.roles });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await usersService.update(editing.id, { name: form.name, roleNames: form.roleNames });
      } else {
        await usersService.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.message ?? "No se pudo guardar el usuario");
    }
  }

  async function handleDelete(u: AdminUser) {
    if (!confirmDelete(u.name)) return;
    try {
      await usersService.remove(u.id);
      load();
    } catch (err: any) {
      alert(err.message ?? "No se pudo eliminar — puede tener pedidos o auditoría asociados. Desactívalo en su lugar.");
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
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
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
                <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {u.active ? "Activo" : "Inactivo"}
                </button>
              ),
            },
            {
              header: "Acciones",
              render: (u) => (
                <div className="flex gap-1">
                  <IconBtn onClick={() => openEdit(u)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => handleDelete(u)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} title={editing ? "Editar usuario" : "Nuevo usuario"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <input required placeholder="Nombre" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required disabled={!!editing} type="email" placeholder="Correo" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {!editing && (
            <input required type="password" placeholder="Contraseña (mín. 6 caracteres)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <div>
            <p className="text-xs text-slate-500 mb-1">Roles</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button key={role} type="button" onClick={() => toggleRole(role)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${form.roleNames.includes(role) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {role}
                </button>
              ))}
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
