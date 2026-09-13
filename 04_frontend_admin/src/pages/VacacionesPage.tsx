import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { VacationPeriod } from "../types/finance";

// Section 17 — Vacaciones escolares (BN-006): objetivo / días disponibles = ahorro diario.
export function VacacionesPage() {
  const [vacations, setVacations] = useState<VacationPeriod[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "Vacaciones",
    startDate: "",
    endDate: "",
    days: "",
    targetAmount: "",
  });

  function load() {
    financeService.listVacations().then(setVacations);
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await financeService.createVacation({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      days: Number(form.days),
      targetAmount: Number(form.targetAmount),
      currentSavings: 0,
    });
    setModalOpen(false);
    setForm({ name: "Vacaciones", startDate: "", endDate: "", days: "", targetAmount: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Vacaciones</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
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
              <p className="font-medium text-slate-800 mb-1">{v.name}</p>
              <p className="text-xs text-slate-400 mb-2">
                {new Date(v.startDate).toLocaleDateString("es-MX")} — {new Date(v.endDate).toLocaleDateString("es-MX")} ·{" "}
                {v.days} días
              </p>
              <ProgressBar percent={percent} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>
                  ${v.currentSavings.toLocaleString("es-MX")} / ${v.targetAmount.toLocaleString("es-MX")}
                </span>
                <span>Ahorro diario necesario: ${dailyNeed.toFixed(2)}</span>
              </div>
            </Card>
          );
        })}
        {vacations.length === 0 && (
          <p className="text-sm text-slate-400 col-span-2">Aún no hay periodos de vacaciones configurados.</p>
        )}
      </div>

      <Modal open={modalOpen} title="Nuevo periodo de vacaciones" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            required
            placeholder="Nombre (ej. Vacaciones SEP)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="date"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <input
            type="date"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <input
            type="number"
            required
            placeholder="Número de días"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.days}
            onChange={(e) => setForm({ ...form, days: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            required
            placeholder="Objetivo económico"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
