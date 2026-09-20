import React, { useEffect, useState } from "react";
import { PiggyBank, Pencil, Trash2, CalendarRange } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { Modal } from "../components/Modal";
import { financeService } from "../services/financeService";
import { settingsService } from "../services/settingsService";
import type { DashboardSummary, EvolutionPoint, WeekSummary } from "../types/finance";
import type { Setting } from "../types/settings";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function confirmDelete(label: string) {
  return window.confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`);
}

type EvoRange = "week" | "month" | "history";
const RANGE_LABELS: Record<EvoRange, string> = { week: "Semanal", month: "Mensual", history: "Histórico (90 días)" };

// Ajustes posteriores del usuario:
// - Semana laboral de 5 días (no 7) en todos los cálculos operativos.
// - "Ahorro para gastos operativos" y "Meta de ganancia" van juntos, con un
//   TOTAL combinado de cuánto generar por día para cubrir gastos Y llegar a
//   la meta — y la Meta se puede editar sin salir del Dashboard.
// - Nuevo tablero "Corte semanal".
export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ventasDraft, setVentasDraft] = useState("");
  const [gastosDraft, setGastosDraft] = useState("");
  const [savingMsg, setSavingMsg] = useState<string | null>(null);

  const [evoRange, setEvoRange] = useState<EvoRange>("week");
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeekSummary[]>([]);

  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaSettings, setMetaSettings] = useState<Setting[]>([]);
  const [metaDrafts, setMetaDrafts] = useState<Record<string, string>>({});

  function load(date: string) {
    setError(null);
    financeService
      .getDashboard(date)
      .then((d) => {
        setData(d);
        setVentasDraft(String(d.ventasDia));
        setGastosDraft(String(d.gastosDia));
      })
      .catch((e) => setError(e.message ?? "No se pudo cargar el dashboard"));
  }
  function loadEvolution() {
    financeService.getEvolution(evoRange).then((r) => setEvolution(r.series));
  }
  function loadWeekly() {
    financeService.getWeeklySummary(8).then((r) => setWeeklySummary(r.weeks));
  }
  useEffect(() => load(selectedDate), [selectedDate]);
  useEffect(loadEvolution, [evoRange]);
  useEffect(loadWeekly, []);

  async function saveVentas() {
    setSavingMsg(null);
    try {
      await financeService.upsertIncome(selectedDate, Number(ventasDraft));
      setSavingMsg("✓ Ventas del día guardadas");
      load(selectedDate);
      loadEvolution();
      loadWeekly();
    } catch (e: any) {
      setSavingMsg(e.message ?? "No se pudo guardar");
    }
  }
  async function saveGastos() {
    setSavingMsg(null);
    try {
      await financeService.upsertDailyExpense(selectedDate, Number(gastosDraft));
      setSavingMsg("✓ Gastos del día guardados");
      load(selectedDate);
      loadEvolution();
      loadWeekly();
    } catch (e: any) {
      setSavingMsg(e.message ?? "No se pudo guardar");
    }
  }

  function editRow(row: EvolutionPoint) {
    setSelectedDate(row.fecha);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteRow(row: EvolutionPoint) {
    if (!confirmDelete(`registro del ${row.fecha}`)) return;
    if (row.incomeId) await financeService.deleteIncome(row.incomeId);
    if (row.dailyExpenseId) await financeService.deleteDailyExpense(row.dailyExpenseId);
    loadEvolution();
    loadWeekly();
    if (row.fecha === selectedDate) load(selectedDate);
  }

  async function openMetaModal() {
    const list = await settingsService.list();
    const relevant = list.filter((s) => s.key.startsWith("finance.profitGoal"));
    setMetaSettings(relevant);
    setMetaDrafts(Object.fromEntries(relevant.map((s) => [s.id, s.value])));
    setMetaModalOpen(true);
  }
  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    for (const s of metaSettings) {
      if (metaDrafts[s.id] !== s.value) {
        await settingsService.update(s.id, metaDrafts[s.id]);
      }
    }
    setMetaModalOpen(false);
    load(selectedDate);
  }
  const metaFieldLabel: Record<string, string> = {
    "finance.profitGoal": "Meta de ganancia ($)",
    "finance.profitGoalStartDate": "Fecha inicial (AAAA-MM-DD)",
    "finance.profitGoalEndDate": "Fecha final (AAAA-MM-DD)",
  };

  if (error) {
    return <Card className="text-sm text-rose-600">{error} — verifica que el backend esté corriendo en <code>VITE_API_URL</code>.</Card>;
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando dashboard…</p>;

  const historyRows = [...evolution].reverse();
  const totalDiarioObjetivo = data.gastosOperativos.ahorroDiarioNecesario + data.metaGanancia.gananciaDiariaNecesaria;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Dashboard financiero</h2>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* RESUMEN DEL DÍA */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Resumen del día</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ventas del día</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={ventasDraft} onChange={(e) => setVentasDraft(e.target.value)} />
              <button onClick={saveVentas} className="text-xs bg-emerald-600 text-white px-3 rounded-lg hover:bg-emerald-700 shrink-0">Guardar</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Gastos del día</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" value={gastosDraft} onChange={(e) => setGastosDraft(e.target.value)} />
              <button onClick={saveGastos} className="text-xs bg-rose-600 text-white px-3 rounded-lg hover:bg-rose-700 shrink-0">Guardar</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ganancia neta (automático)</label>
            <p className={`text-lg font-semibold pt-1.5 ${data.gananciaNeta >= 0 ? "text-blue-700" : "text-rose-600"}`}>{money(data.gananciaNeta)}</p>
          </div>
        </div>
        {savingMsg && <p className="text-xs text-slate-500">{savingMsg}</p>}
      </Card>

      {/* AHORRO OPERATIVO + META DE GANANCIA, JUNTOS */}
      <Card className="bg-indigo-50 border-indigo-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-indigo-600" />
            <p className="text-sm font-medium text-indigo-700">Ahorro operativo y Meta de ganancia</p>
          </div>
          <button onClick={openMetaModal} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
            <Pencil className="h-3.5 w-3.5" /> Editar meta
          </button>
        </div>
        <p className="text-xs text-indigo-500 mb-3">Semana laboral de 5 días (lunes a viernes)</p>

        <p className="text-xs font-semibold text-indigo-600 mb-1">Gastos operativos (Renta + Nómina + Gastos)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mb-3">
          <div><p className="text-indigo-400">Renta/sem (≈{money(data.gastosOperativos.rentaDiaria)}/día)</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.rentaSemanal)}</p></div>
          <div><p className="text-indigo-400">Nómina/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.nominaSemanal)}</p></div>
          <div><p className="text-indigo-400">Gastos fijos/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.gastosFijosSemanal)}</p></div>
          <div><p className="text-indigo-400">Gastos del día (5d)</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.gastosDiaSemanal)}</p></div>
          <div><p className="text-indigo-400">Total/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.pagosSemanales)}</p></div>
        </div>
        <p className="text-sm text-indigo-700 mb-4">
          Necesitas <b>{money(data.gastosOperativos.ahorroDiarioNecesario)}/día</b> solo para cubrir gastos operativos.
        </p>

        <p className="text-xs font-semibold text-indigo-600 mb-1">Meta de ganancia</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-2">
          <div><p className="text-indigo-400">Meta</p><p className="font-semibold text-indigo-800">{money(data.metaGanancia.profitGoal)}</p></div>
          <div><p className="text-indigo-400">Ganado hasta hoy</p><p className="font-semibold text-indigo-800">{money(data.metaGanancia.gananciaAcumulada)}</p></div>
          <div><p className="text-indigo-400">Falta</p><p className="font-semibold text-indigo-800">{money(data.metaGanancia.faltante)}</p></div>
        </div>
        <ProgressBar percent={data.metaGanancia.progreso} />
        <p className="text-sm text-indigo-700 mt-2 mb-4">
          Necesitas ganar <b>{money(data.metaGanancia.gananciaDiariaNecesaria)}/día</b> para llegar a la meta ({data.metaGanancia.progreso}% cumplido).
        </p>
        {data.metaGanancia.metaVencida && <p className="text-xs text-rose-600 mb-3">⚠️ La fecha de la meta ya pasó y aún falta {money(data.metaGanancia.faltante)}.</p>}

        <div className="border-t border-indigo-200 pt-3">
          <p className="text-xs text-indigo-500">Total a generar por día (gastos + meta)</p>
          <p className="text-2xl font-bold text-indigo-900">{money(totalDiarioObjetivo)} <span className="text-xs font-normal text-indigo-400">/ día</span></p>
        </div>
      </Card>

      {/* CORTE SEMANAL */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-medium text-slate-700">Corte semanal</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Semana</th>
                <th className="py-2 pr-4 font-medium">Ventas</th>
                <th className="py-2 pr-4 font-medium">Gastos</th>
                <th className="py-2 pr-4 font-medium">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {[...weeklySummary].reverse().map((w) => (
                <tr key={w.weekStart} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-600">{w.weekStart} — {w.weekEnd}</td>
                  <td className="py-1.5 pr-4 text-emerald-700">{money(w.ventas)}</td>
                  <td className="py-1.5 pr-4 text-rose-600">{money(w.gastos)}</td>
                  <td className={`py-1.5 pr-4 font-medium ${w.ganancia >= 0 ? "text-blue-700" : "text-rose-700"}`}>{money(w.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Falta {money(data.metaGanancia.faltante)} para la meta de ganancia · necesitas {money(data.metaGanancia.gananciaDiariaNecesaria)}/día para lograrlo.
        </p>
      </Card>

      {/* HISTORIAL DIARIO */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Evolución de Ventas y Gastos</p>
          <div className="flex gap-2">
            {(["week", "month", "history"] as EvoRange[]).map((r) => (
              <button key={r} onClick={() => setEvoRange(r)} className={`text-xs px-3 py-1 rounded-full font-medium ${evoRange === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={evolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => money(v)} labelFormatter={(l) => l} />
            <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} dot={false} name="Ventas" />
            <Line type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} dot={false} name="Gastos" />
            <Line type="monotone" dataKey="ganancia" stroke="#3b82f6" strokeWidth={2} dot={false} name="Ganancia" />
          </LineChart>
        </ResponsiveContainer>

        <div className="overflow-x-auto mt-4 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Ventas</th>
                <th className="py-2 pr-4 font-medium">Gastos</th>
                <th className="py-2 pr-4 font-medium">Ganancia</th>
                <th className="py-2 pr-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.fecha} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-600">{row.fecha}</td>
                  <td className="py-1.5 pr-4 text-emerald-700">{money(row.ventas)}</td>
                  <td className="py-1.5 pr-4 text-rose-600">{money(row.gastos)}</td>
                  <td className={`py-1.5 pr-4 font-medium ${row.ganancia >= 0 ? "text-blue-700" : "text-rose-700"}`}>{money(row.ganancia)}</td>
                  <td className="py-1.5 pr-4">
                    {(row.incomeId || row.dailyExpenseId) && (
                      <div className="flex gap-1">
                        <button onClick={() => editRow(row)} title="Editar" className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteRow(row)} title="Eliminar" className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {historyRows.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-400 py-4">Sin registros todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={metaModalOpen} title="Editar Meta de ganancia" onClose={() => setMetaModalOpen(false)}>
        <form onSubmit={saveMeta} className="space-y-3">
          {metaSettings.map((s) => (
            <div key={s.id}>
              <label className="block text-xs text-slate-500 mb-1">{metaFieldLabel[s.key] ?? s.key}</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={metaDrafts[s.id] ?? ""}
                onChange={(e) => setMetaDrafts({ ...metaDrafts, [s.id]: e.target.value })}
              />
            </div>
          ))}
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </Modal>
    </div>
  );
}
