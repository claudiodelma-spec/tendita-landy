import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { Goal, Periodicity, Savings } from "../types/finance";

const TYPES: Periodicity[] = ["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO"];

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

// Section 15/16 — Metas (BN-005) y Ahorro. La "Meta de ganancia" automática
// (margen configurable + progreso calculado solo) vive en el Dashboard y en
// Configuración — esta pantalla es para metas manuales adicionales que el
// administrador quiera trackear aparte, más el registro de ahorro real.
export function MetasAhorroPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [savingModalOpen, setSavingModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingSaving, setEditingSaving] = useState<Savings | null>(null);

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

  function openCreateGoal() {
    setEditingGoal(null);
    setGoalForm({ name: "", type: "MENSUAL", targetValue: "", startDate: new Date().toISOString().slice(0, 10), endDate: "" });
    setGoalModalOpen(true);
  }
  function openEditGoal(g: Goal) {
    setEditingGoal(g);
    setGoalForm({ name: g.name, type: g.type, targetValue: String(g.targetValue), startDate: g.startDate.slice(0, 10), endDate: g.endDate.slice(0, 10) });
    setGoalModalOpen(true);
  }
  function openCreateSaving() {
    setEditingSaving(null);
    setSavingForm({ label: "", amount: "", type: "DIARIO" });
    setSavingModalOpen(true);
  }
  function openEditSaving(s: Savings) {
    setEditingSaving(s);
    setSavingForm({ label: s.label, amount: String(s.amount), type: s.type });
    setSavingModalOpen(true);
  }

  async function handleSubmitGoal(e: React.FormEvent) {
    e.preventDefault();
    if (editingGoal) {
      await financeService.updateGoal(editingGoal.id, {
        name: goalForm.name,
        type: goalForm.type,
        targetValue: Number(goalForm.targetValue),
        startDate: goalForm.startDate,
        endDate: goalForm.endDate,
      });
    } else {
      await financeService.createGoal({
        name: goalForm.name,
        type: goalForm.type,
        targetValue: Number(goalForm.targetValue),
        startDate: goalForm.startDate,
        endDate: goalForm.endDate,
        currentValue: 0,
        status: "ACTIVE",
      });
    }
    setGoalModalOpen(false);
    load();
  }

  async function handleDeleteGoal(g: Goal) {
    if (!confirmDelete(g.name)) return;
    await financeService.deleteGoal(g.id);
    load();
  }

  async function handleSubmitSaving(e: React.FormEvent) {
    e.preventDefault();
    if (editingSaving) {
      await financeService.updateSaving(editingSaving.id, { label: savingForm.label, amount: Number(savingForm.amount), type: savingForm.type });
    } else {
      await financeService.createSaving({ label: savingForm.label, amount: Number(savingForm.amount), date: new Date().toISOString().slice(0, 10), type: savingForm.type });
    }
    setSavingModalOpen(false);
    load();
  }

  async function handleDeleteSaving(s: Savings) {
    if (!confirmDelete(s.label)) return;
    await financeService.deleteSaving(s.id);
    load();
  }

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Metas y Ahorro</h2>
        <div className="flex gap-2">
          <button onClick={openCreateSaving} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Registrar ahorro
          </button>
          <button onClick={openCreateGoal} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nueva meta
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 -mt-3">
        La Meta de ganancia automática (margen configurable, progreso calculado solo) se ve en el Dashboard — se
        edita en Configuración. Aquí puedes llevar metas manuales adicionales.
      </p>

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
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 mr-1">{Math.round(percent)}%</span>
                  <IconBtn onClick={() => openEditGoal(g)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => handleDeleteGoal(g)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
              <ProgressBar percent={percent} />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>${g.currentValue.toLocaleString("es-MX")} / ${g.targetValue.toLocaleString("es-MX")}</span>
                <span>Necesidad diaria: ${dailyNeed.toFixed(2)}</span>
              </div>
            </Card>
          );
        })}
        {goals.length === 0 && <p className="text-sm text-slate-400 col-span-2">Aún no hay metas registradas.</p>}
      </div>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Movimientos de ahorro</p>
        <div className="divide-y divide-slate-50">
          {savings.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="text-slate-700">{s.label}</p>
                <p className="text-xs text-slate-400">{new Date(s.date).toLocaleDateString("es-MX")} · {s.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-emerald-700">${s.amount.toLocaleString("es-MX")}</span>
                <IconBtn onClick={() => openEditSaving(s)} title="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                <IconBtn onClick={() => handleDeleteSaving(s)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></IconBtn>
              </div>
            </div>
          ))}
          {savings.length === 0 && <p className="text-sm text-slate-400 py-4">Aún no hay ahorros registrados.</p>}
        </div>
      </Card>

      <Modal open={goalModalOpen} title={editingGoal ? "Editar meta" : "Nueva meta"} onClose={() => setGoalModalOpen(false)}>
        <form onSubmit={handleSubmitGoal} className="space-y-3">
          <input required placeholder="Nombre de la meta" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} />
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value as Periodicity })}>
            {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <input type="number" step="0.01" required placeholder="Valor objetivo" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} />
          <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={goalForm.startDate} onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })} />
          <input type="date" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={goalForm.endDate} onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })} />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>

      <Modal open={savingModalOpen} title={editingSaving ? "Editar ahorro" : "Registrar ahorro"} onClose={() => setSavingModalOpen(false)}>
        <form onSubmit={handleSubmitSaving} className="space-y-3">
          <input required placeholder="Etiqueta (ej. Ahorro semanal)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={savingForm.label} onChange={(e) => setSavingForm({ ...savingForm, label: e.target.value })} />
          <input type="number" step="0.01" required placeholder="Monto" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={savingForm.amount} onChange={(e) => setSavingForm({ ...savingForm, amount: e.target.value })} />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
