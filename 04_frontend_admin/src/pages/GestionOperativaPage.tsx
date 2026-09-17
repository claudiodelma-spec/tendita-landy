import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { PeriodicityBadge } from "../components/PeriodicityBadge";
import { financeService } from "../services/financeService";
import type { Employee, Expense, ExpenseCategory, Periodicity, Rent } from "../types/finance";

const PERIODICITIES: Periodicity[] = ["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO"];
const TABS = [
  { key: "renta", label: "Renta" },
  { key: "nomina", label: "Nómina" },
  { key: "gastos", label: "Gastos" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

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

// Pedido del usuario: "Renta, Nómina y Gastos puede poner en uno solo" —
// una sola pantalla con pestañas, en vez de 3 entradas separadas en el menú.
// Cada pestaña ahora tiene crear/editar/eliminar completos.
export function GestionOperativaPage() {
  const [tab, setTab] = useState<TabKey>("renta");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Renta, Nómina y Gastos</h2>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "renta" && <RentaTab />}
      {tab === "nomina" && <NominaTab />}
      {tab === "gastos" && <GastosTab />}
    </div>
  );
}

// ---------------------------------------------------------------- RENTA ---
function RentaTab() {
  const [rents, setRents] = useState<Rent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rent | null>(null);
  const [form, setForm] = useState({
    concept: "Renta local escolar",
    value: "",
    periodicity: "SEMANAL" as Periodicity,
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  function load() {
    setLoading(true);
    financeService.listRents().then(setRents).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ concept: "Renta local escolar", value: "", periodicity: "SEMANAL", startDate: new Date().toISOString().slice(0, 10), notes: "" });
    setModalOpen(true);
  }
  function openEdit(r: Rent) {
    setEditing(r);
    setForm({
      concept: r.concept ?? "",
      value: String(r.value),
      periodicity: r.periodicity,
      startDate: r.startDate.slice(0, 10),
      notes: r.notes ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await financeService.updateRent(editing.id, {
        concept: form.concept,
        value: Number(form.value),
        periodicity: form.periodicity,
        startDate: form.startDate,
        notes: form.notes || undefined,
      });
    } else {
      // Nuevo periodo: cierra el activo anterior (histórico preservado, BN-001)
      // y crea el nuevo como activo.
      const active = rents.find((r) => r.status === "ACTIVE");
      if (active) {
        await financeService.updateRent(active.id, { status: "INACTIVE", endDate: form.startDate });
      }
      await financeService.createRent({
        concept: form.concept,
        value: Number(form.value),
        periodicity: form.periodicity,
        startDate: form.startDate,
        notes: form.notes || undefined,
        status: "ACTIVE",
      });
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(r: Rent) {
    if (!confirmDelete(r.concept ?? "Renta")) return;
    await financeService.deleteRent(r.id);
    load();
  }

  const active = rents.find((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Historial de rentas (el valor activo se usa en Ahorro operativo)</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo periodo
        </button>
      </div>

      {active && (
        <Card className="bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-500 mb-1">Renta activa</p>
          <p className="text-xl font-semibold text-blue-800">
            ${active.value.toLocaleString("es-MX")} <PeriodicityBadge value={active.periodicity} />
          </p>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : (
          <DataTable
            rows={rents}
            emptyMessage="Aún no hay periodos de renta registrados."
            columns={[
              { header: "Concepto", render: (r) => r.concept ?? "Renta" },
              { header: "Valor", render: (r) => `$${r.value.toLocaleString("es-MX")}` },
              { header: "Periodicidad", render: (r) => <PeriodicityBadge value={r.periodicity} /> },
              { header: "Desde", render: (r) => new Date(r.startDate).toLocaleDateString("es-MX") },
              { header: "Hasta", render: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString("es-MX") : "—") },
              {
                header: "Estado",
                render: (r) => (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {r.status === "ACTIVE" ? "Activo" : "Histórico"}
                  </span>
                ),
              },
              {
                header: "Acciones",
                render: (r) => (
                  <div className="flex gap-1">
                    <IconBtn onClick={() => openEdit(r)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn onClick={() => handleDelete(r)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal open={modalOpen} title={editing ? "Editar periodo de renta" : "Nuevo periodo de renta"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Concepto</label>
            <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Valor</label>
            <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periodicidad</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.periodicity} onChange={(e) => setForm({ ...form, periodicity: e.target.value as Periodicity })}>
              {PERIODICITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{editing ? "Vigente desde" : "Nueva vigencia desde"}</label>
            <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notas</label>
            <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}

// --------------------------------------------------------------- NÓMINA ---
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday;
}

function NominaTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [worked, setWorked] = useState<Record<string, boolean[]>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", dailySalary: "", startDate: new Date().toISOString().slice(0, 10) });

  const weekStart = startOfWeekMonday(new Date());

  function load() {
    financeService.listEmployees().then((list) => {
      setEmployees(list);
      setWorked((prev) => {
        const next = { ...prev };
        for (const emp of list) if (!next[emp.id]) next[emp.id] = [true, true, true, true, true];
        return next;
      });
    });
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", dailySalary: "", startDate: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }
  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({ name: emp.name, dailySalary: String(emp.dailySalary), startDate: emp.startDate.slice(0, 10) });
    setModalOpen(true);
  }

  async function toggleDay(employeeId: string, dayIndex: number) {
    const current = worked[employeeId] ?? [true, true, true, true, true];
    const next = current.map((v, i) => (i === dayIndex ? !v : v));
    setWorked({ ...worked, [employeeId]: next });
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    await financeService.markPayrollDay(employeeId, date.toISOString().slice(0, 10), next[dayIndex]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await financeService.updateEmployee(editing.id, { name: form.name, dailySalary: Number(form.dailySalary) });
    } else {
      await financeService.createEmployee({ name: form.name, dailySalary: Number(form.dailySalary), startDate: form.startDate, active: true });
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(emp: Employee) {
    if (!confirmDelete(emp.name)) return;
    await financeService.deleteEmployee(emp.id);
    load();
  }

  function weeklyTotal(emp: Employee) {
    const days = worked[emp.id] ?? [];
    return days.filter(Boolean).length * emp.dailySalary;
  }
  const grandTotal = employees.reduce((sum, e) => sum + weeklyTotal(e), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Marca los días trabajados de esta semana</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo empleado
        </button>
      </div>

      <Card className="bg-blue-50 border-blue-100">
        <p className="text-xs text-blue-500 mb-1">Nómina de esta semana</p>
        <p className="text-2xl font-semibold text-blue-800">${grandTotal.toLocaleString("es-MX")}</p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Empleado</th>
                <th className="py-2 pr-4 font-medium">Salario/día</th>
                {WEEKDAYS.map((d) => (<th key={d} className="py-2 px-2 font-medium text-center">{d.slice(0, 3)}</th>))}
                <th className="py-2 pl-4 font-medium">Total semana</th>
                <th className="py-2 pl-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-700">{emp.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">${emp.dailySalary}</td>
                  {WEEKDAYS.map((_, i) => (
                    <td key={i} className="py-2.5 px-2 text-center">
                      <input type="checkbox" checked={worked[emp.id]?.[i] ?? true} onChange={() => toggleDay(emp.id, i)} className="h-4 w-4 accent-blue-600" />
                    </td>
                  ))}
                  <td className="py-2.5 pl-4 font-medium text-slate-800">${weeklyTotal(emp).toLocaleString("es-MX")}</td>
                  <td className="py-2.5 pl-4">
                    <div className="flex gap-1">
                      <IconBtn onClick={() => openEdit(emp)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn onClick={() => handleDelete(emp)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={9} className="text-center text-slate-400 py-6">Aún no hay empleados registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} title={editing ? "Editar empleado" : "Nuevo empleado"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Salario diario</label>
            <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.dailySalary} onChange={(e) => setForm({ ...form, dailySalary: e.target.value })} />
          </div>
          {!editing && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha de inicio</label>
              <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
          )}
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}

// --------------------------------------------------------------- GASTOS ---
function GastosTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({
    concept: "",
    categoryId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    periodicity: "MENSUAL" as Periodicity,
    description: "",
  });

  function load() {
    financeService.listExpenses().then(setExpenses);
    financeService.listExpenseCategories().then(setCategories);
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ concept: "", categoryId: "", amount: "", date: new Date().toISOString().slice(0, 10), periodicity: "MENSUAL", description: "" });
    setNewCategory("");
    setModalOpen(true);
  }
  function openEdit(exp: Expense) {
    setEditing(exp);
    setForm({
      concept: exp.concept,
      categoryId: exp.categoryId,
      amount: String(exp.amount),
      date: exp.date.slice(0, 10),
      periodicity: exp.periodicity,
      description: exp.description ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let categoryId = form.categoryId;
    if (!categoryId && newCategory.trim()) {
      const cat = await financeService.createExpenseCategory(newCategory.trim());
      categoryId = cat.id;
    }
    if (editing) {
      await financeService.updateExpense(editing.id, {
        concept: form.concept,
        categoryId,
        amount: Number(form.amount),
        date: form.date,
        periodicity: form.periodicity,
        description: form.description || undefined,
      });
    } else {
      await financeService.createExpense({
        concept: form.concept,
        categoryId,
        amount: Number(form.amount),
        date: form.date,
        periodicity: form.periodicity,
        description: form.description || undefined,
        status: "ACTIVE",
      });
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(exp: Expense) {
    if (!confirmDelete(exp.concept)) return;
    await financeService.deleteExpense(exp.id);
    load();
  }

  const total = expenses.filter((e) => e.status === "ACTIVE").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Gastos categorizados (Renta y Nómina se llevan aparte)</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo gasto
        </button>
      </div>

      <Card className="bg-rose-50 border-rose-100">
        <p className="text-xs text-rose-500 mb-1">Gastos activos (total)</p>
        <p className="text-2xl font-semibold text-rose-700">${total.toLocaleString("es-MX")}</p>
      </Card>

      <Card>
        <DataTable
          rows={expenses}
          emptyMessage="Aún no hay gastos registrados."
          columns={[
            { header: "Concepto", render: (e) => e.concept },
            { header: "Categoría", render: (e) => e.category?.name ?? categories.find((c) => c.id === e.categoryId)?.name ?? "—" },
            { header: "Monto", render: (e) => `$${e.amount.toLocaleString("es-MX")}` },
            { header: "Periodicidad", render: (e) => <PeriodicityBadge value={e.periodicity} /> },
            { header: "Fecha", render: (e) => new Date(e.date).toLocaleDateString("es-MX") },
            {
              header: "Estado",
              render: (e) => (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {e.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              ),
            },
            {
              header: "Acciones",
              render: (e) => (
                <div className="flex gap-1">
                  <IconBtn onClick={() => openEdit(e)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => handleDelete(e)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} title={editing ? "Editar gasto" : "Nuevo gasto"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Concepto</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Categoría</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— Nueva categoría —</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            {!form.categoryId && (
              <input placeholder="Nombre de la nueva categoría" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Monto</label>
            <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periodicidad</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.periodicity} onChange={(e) => setForm({ ...form, periodicity: e.target.value as Periodicity })}>
              {PERIODICITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha</label>
            <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
