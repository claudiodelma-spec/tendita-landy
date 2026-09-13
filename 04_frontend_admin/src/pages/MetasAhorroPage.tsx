import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { Goal, Periodicity, Savings } from "../types/finance";

const TYPES: Periodicity[] = ["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO"];

// Section 15/16 — Metas (BN-005) y Ahorro, cada una con objetivo/acumulado/
// faltante/% y necesidad diaria calculada del lado del servidor.
export function MetasAhorroPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);

  const [goalForm, setGoalForm] = useState({
    name: "",
    type: "MENSUAL" as Periodicity,
    targetValue: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });
  const [savingForm, setSavingForm] = useState({ label: "", amount: "", type: "DIARIO" as Savings["type"] });

  function load() {
    financeService.listGoals().then(setGoals);
    financeService.listSavings().then(setSavings);
  }
  useEffect(load, []);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    await financeService.createGoal({
      name: goalForm.name,
      type: goalForm.type,
      targetValue: Number(goalForm.targetValue),
      startDate: goalForm.startDate,
      endDate: goalForm.endDate,
      currentValue: 0,
      status: "ACTIVE",
    });
    setGoalModalOpen(false);
    setGoalForm({ name: "", type: "MENSUAL", targetValue: "", startDate: new Date().toISOString().slice(0, 10), endDate: "" });
    load();
  }

  async function handleCreateSaving(e: React.FormEvent) {
    e.preventDefault();
    await financeService.createSaving({
      label: savingForm.label,
      amount: Number(savingForm.amount),
      date: new Date().toISOString().slice(0, 10),
      type: savingForm.type,
    });
    setSavingModalOpen(false);
    setSavingForm({ label: "", amount: "", type: "DIARIO" });
    load();
  }

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Metas y Ahorro</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSavingModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" /> Registrar ahorro
          </button>
          <button
            onClick={() => setGoalModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Nueva meta
          </button>
        </div>
      </div>

      <Card className="bg-emerald-50 border-emerald-100">
        <p className="text-xs text-emerald-600 mb-1">Ahorro acumulado</p>
        <p className="text-2xl font-semibold text-emerald-800">${totalSavings.toLocaleString("es-MX")}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const percent = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
          const daysRemaining = Math.max(1, Math.ceil((new Date(g.endDate).getTime() - Date.now()) / 86400000));
          const dailyNeed = Math.max(0, (g.targetValue - g.currentValue) / daysRemaining);
          return (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-slate-800">{g.name}</p>
                  <p className="text-xs text-slate-400">{g.type}</p>
                </div>
                <span className="text-xs text-slate-500">{Math.round(percent)}%</span>
              </div>
              <ProgressBar percent={percent} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>
                  ${g.currentValue.toLocaleString("es-MX")} / ${g.targetValue.toLocaleString("es-MX")}
                </span>
                <span>Necesidad diaria: ${dailyNeed.toFixed(2)}</span>
              </div>
            </Card>
          );
        })}
        {goals.length === 0 && <p className="text-sm text-slate-400 col-span-2">Aún no hay metas registradas.</p>}
      </div>

      <Modal open={goalModalOpen} title="Nueva meta" onClose={() => setGoalModalOpen(false)}>
        <form onSubmit={handleCreateGoal} className="space-y-3">
          <input
            required
            placeholder="Nombre de la meta"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={goalForm.name}
            onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
          />
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={goalForm.type}
            onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as Periodicity })}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            required
            placeholder="Valor objetivo"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={goalForm.targetValue}
            onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
          />
          <input
            type="date"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={goalForm.startDate}
            onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
          />
          <input
            type="date"
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={goalForm.endDate}
            onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>

      <Modal open={savingModalOpen} title="Registrar ahorro" onClose={() => setSavingModalOpen(false)}>
        <form onSubmit={handleCreateSaving} className="space-y-3">
          <input
            required
            placeholder="Etiqueta (ej. Ahorro semanal)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={savingForm.label}
            onChange={(e) => setSavingForm({ ...savingForm, label: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            required
            placeholder="Monto"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={savingForm.amount}
            onChange={(e) => setSavingForm({ ...savingForm, amount: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
