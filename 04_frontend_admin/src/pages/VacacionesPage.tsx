import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { VacationPeriod } from "../types/finance";

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

// Section 17 — Vacaciones escolares (BN-006): objetivo / días disponibles = ahorro diario.
export function VacacionesPage() {
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VacationPeriod | null>(null);
  const [form, setForm] = useState({ name: "Vacaciones", startDate: "", endDate: "", days: "", targetAmount: "", currentSavings: "" });

  function load() {
    financeService.listVacations().then(setVacations);
  }
  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "Vacaciones", startDate: "", endDate: "", days: "", targetAmount: "", currentSavings: "" });
    setModalOpen(true);
  }
  function openEdit(v: VacationPeriod) {
    setEditing(v);
    setForm({
      name: v.name,
      startDate: v.startDate.slice(0, 10),
      endDate: v.endDate.slice(0, 10),
      days: String(v.days),
      targetAmount: String(v.targetAmount),
      currentSavings: String(v.currentSavings),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      days: Number(form.days),
      targetAmount: Number(form.targetAmount),
      currentSavings: Number(form.currentSavings || 0),
    };
    if (editing) {
      await financeService.updateVacation(editing.id, payload);
    } else {
      await financeService.createVacation(payload);
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(v: VacationPeriod) {
    if (!confirmDelete(v.name)) return;
    await financeService.deleteVacation(v.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Vacaciones</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo periodo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vacations.map((v) => {
          const percent = v.targetAmount > 0 ? (v.currentSavings / v.targetAmount) * 100 : 0;
          const daysUntilStart = Math.max(1, Math.ceil((new Date(v.startDate).getTime() - Date.now()) / 86400000));
          const dailyNeed = Math.max(0, (v.targetAmount - v.currentSavings) / daysUntilStart);
          return (
            <Card key={v.id}>
              <div className="flex justify-between items-start">
                <p className="font-medium text-slate-800 mb-1">{v.name}</p>
                <div className="flex gap-1">
                  <IconBtn onClick={() => openEdit(v)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => handleDelete(v)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                {new Date(v.startDate).toLocaleDateString("es-MX")} — {new Date(v.endDate).toLocaleDateString("es-MX")} · {v.days} días
              </p>
              <ProgressBar percent={percent} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>${v.currentSavings.toLocaleString("es-MX")} / ${v.targetAmount.toLocaleString("es-MX")}</span>
                <span>Ahorro diario necesario: ${dailyNeed.toFixed(2)}</span>
              </div>
            </Card>
          );
        })}
        {vacations.length === 0 && <p className="text-sm text-slate-400 col-span-2">Aún no hay periodos de vacaciones configurados.</p>}
      </div>

      <Modal open={modalOpen} title={editing ? "Editar periodo de vacaciones" : "Nuevo periodo de vacaciones"} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Nombre (ej. Vacaciones SEP)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <input type="number" required placeholder="Número de días" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
          <input type="number" step="0.01" required placeholder="Objetivo económico" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
          {editing && (
            <input type="number" step="0.01" placeholder="Ahorrado hasta ahora" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={form.currentSavings} onChange={(e) => setForm({ ...form, currentSavings: e.target.value })} />
          )}
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
