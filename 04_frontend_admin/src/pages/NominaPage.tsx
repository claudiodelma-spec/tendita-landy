import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { financeService } from "../services/financeService";
import type { Employee } from "../types/finance";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

function startOfWeekMonday(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  return monday;
}

// Section 12 — Nómina: total = Σ (salario_diario × días_trabajados). Si no se
// marca ningún día trabajado, el total es $0 (regla explícita de la sección 12).
export function NominaPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [worked, setWorked] = useState<Record<string, boolean[]>>({}); // employeeId -> [Lun..Vie]
  const [modalOpen, setModalOpen] = useState(false);
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

  async function toggleDay(employeeId: string, dayIndex: number) {
    const current = worked[employeeId] ?? [true, true, true, true, true];
    const next = current.map((v, i) => (i === dayIndex ? !v : v));
    setWorked({ ...worked, [employeeId]: next });

    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + dayIndex);
    await financeService.markPayrollDay(employeeId, date.toISOString().slice(0, 10), next[dayIndex]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await financeService.createEmployee({
      name: form.name,
      dailySalary: Number(form.dailySalary),
      startDate: form.startDate,
      active: true,
    });
    setModalOpen(false);
    setForm({ name: "", dailySalary: "", startDate: new Date().toISOString().slice(0, 10) });
    load();
  }

  function weeklyTotal(emp: Employee) {
    const days = worked[emp.id] ?? [];
    return days.filter(Boolean).length * emp.dailySalary;
  }
  const grandTotal = employees.reduce((sum, e) => sum + weeklyTotal(e), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Nómina</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo empleado
        </button>
      </div>

      <Card className="bg-blue-50 border-blue-100">
        <p className="text-xs text-blue-500 mb-1">Nómina de esta semana</p>
        <p className="text-2xl font-semibold text-blue-800">${grandTotal.toLocaleString("es-MX")}</p>
        <p className="text-xs text-blue-400 mt-1">
          Si nadie trabaja, la nómina es $0 — calculado automáticamente por día marcado.
        </p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Empleado</th>
                <th className="py-2 pr-4 font-medium">Salario/día</th>
                {WEEKDAYS.map((d) => (
                  <th key={d} className="py-2 px-2 font-medium text-center">
                    {d.slice(0, 3)}
                  </th>
                ))}
                <th className="py-2 pl-4 font-medium">Total semana</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 text-slate-700">{emp.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">${emp.dailySalary}</td>
                  {WEEKDAYS.map((_, i) => (
                    <td key={i} className="py-2.5 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={worked[emp.id]?.[i] ?? true}
                        onChange={() => toggleDay(emp.id, i)}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </td>
                  ))}
                  <td className="py-2.5 pl-4 font-medium text-slate-800">
                    ${weeklyTotal(emp).toLocaleString("es-MX")}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-6">
                    Aún no hay empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modalOpen} title="Nuevo empleado" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre</label>
            <input
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Salario diario</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.dailySalary}
              onChange={(e) => setForm({ ...form, dailySalary: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha de inicio</label>
            <input
              type="date"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
