import React, { useEffect, useState } from "react";
import { PiggyBank, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { DashboardSummary, EvolutionPoint } from "../types/finance";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

type EvoRange = "week" | "month" | "history";
const RANGE_LABELS: Record<EvoRange, string> = { week: "Semanal", month: "Mensual", history: "Histórico (90 días)" };

// Corrección "Dashboard financiero" + ajuste posterior del usuario:
// - Resumen del día (manual) + Ganancia neta (automática)
// - Ahorro para gastos operativos (Renta+Nómina+Gastos fusionados — "cuánto
//   tengo que juntar por día para llegar a todos los gastos")
// - Meta de ganancia (configurable, progreso automático)
// - Objetivo de ahorro / Vacaciones (BN-011, sin cambios — cuenta aparte)
// - Evolución semanal/mensual/histórico
export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ventasDraft, setVentasDraft] = useState("");
  const [gastosDraft, setGastosDraft] = useState("");
  const [savingMsg, setSavingMsg] = useState<string | null>(null);

  const [evoRange, setEvoRange] = useState<EvoRange>("week");
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);

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
  useEffect(() => load(selectedDate), [selectedDate]);
  useEffect(() => {
    financeService.getEvolution(evoRange).then((r) => setEvolution(r.series));
  }, [evoRange]);

  async function saveVentas() {
    setSavingMsg(null);
    try {
      await financeService.upsertIncome(selectedDate, Number(ventasDraft));
      setSavingMsg("✓ Ventas del día guardadas");
      load(selectedDate);
      financeService.getEvolution(evoRange).then((r) => setEvolution(r.series));
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
      financeService.getEvolution(evoRange).then((r) => setEvolution(r.series));
    } catch (e: any) {
      setSavingMsg(e.message ?? "No se pudo guardar");
    }
  }

  if (error) {
    return <Card className="text-sm text-rose-600">{error} — verifica que el backend esté corriendo en <code>VITE_API_URL</code>.</Card>;
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando dashboard…</p>;

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

      {/* AHORRO PARA GASTOS OPERATIVOS (Renta + Nómina + Gastos) */}
      <Card className="bg-indigo-50 border-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-medium text-indigo-700">Ahorro para gastos operativos</p>
        </div>
        <p className="text-xs text-indigo-500 mb-3">Cuánto necesitas juntar por día para cubrir Renta + Nómina + Gastos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
          <div><p className="text-indigo-400">Renta/semana</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.rentaSemanal)}</p></div>
          <div><p className="text-indigo-400">Nómina/semana</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.nominaSemanal)}</p></div>
          <div><p className="text-indigo-400">Gastos/semana</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.gastosSemanal)}</p></div>
          <div><p className="text-indigo-400">Total/semana</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.pagosSemanales)}</p></div>
        </div>
        <p className="text-xl font-bold text-indigo-800">
          {money(data.gastosOperativos.ahorroDiarioNecesario)} <span className="text-xs font-normal text-indigo-400">/ día</span>
        </p>
        <p className="text-xs text-indigo-400 mt-1">Se edita en Renta, Nómina y Gastos.</p>
      </Card>

      {/* META DE GANANCIA */}
      <Card className={data.metaGanancia.gananciaAcumulada >= data.metaGanancia.profitGoal && data.metaGanancia.profitGoal > 0 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-amber-600" />
          <p className="text-sm font-medium text-amber-700">Meta de ganancia</p>
        </div>
        <p className="text-xs text-amber-500 mb-3">Calculada sola a partir de tus Ventas/Gastos del día — se edita en Configuración</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-3">
          <div><p className="text-xs text-amber-500">Meta</p><p className="font-semibold text-amber-800">{money(data.metaGanancia.profitGoal)}</p></div>
          <div><p className="text-xs text-amber-500">Ganado hasta hoy</p><p className="font-semibold text-amber-800">{money(data.metaGanancia.gananciaAcumulada)}</p></div>
          <div><p className="text-xs text-amber-500">Falta</p><p className="font-semibold text-amber-800">{money(data.metaGanancia.faltante)}</p></div>
        </div>
        <ProgressBar percent={data.metaGanancia.progreso} />
        <div className="flex justify-between text-xs text-amber-500 mt-2">
          <span>{data.metaGanancia.progreso}% cumplido</span>
          <span>Necesitas ganar {money(data.metaGanancia.gananciaDiariaNecesaria)}/día</span>
        </div>
        {data.metaGanancia.metaVencida && <p className="text-xs text-rose-600 mt-2">⚠️ La fecha de la meta ya pasó y aún falta {money(data.metaGanancia.faltante)}.</p>}
      </Card>

      {/* Ganancia neta vs. ahorro del objetivo — sección 8 */}
      <Card className={data.deficit > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"}>
        <div className="flex items-start gap-3">
          {data.deficit > 0 ? <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
          <div className="text-sm">
            {data.deficit > 0 ? (
              <p className="text-rose-700">Déficit del día (vs. objetivo de ahorro/vacaciones): <b>{money(data.deficit)}</b>. Puedes registrar el ahorro real que consideres posible.</p>
            ) : (
              <p className="text-emerald-700">Ahorro recomendado hoy: <b>{money(data.ahorroRecomendado)}</b> — disponible después: <b>{money(data.disponibleDespues)}</b></p>
            )}
          </div>
        </div>
      </Card>

      {/* OBJETIVO DE AHORRO / VACACIONES */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-1">Objetivo de ahorro y vacaciones</p>
        <p className="text-xs text-slate-400 mb-4">Cuenta aparte del ahorro operativo de arriba</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
          <div><p className="text-xs text-slate-500">Objetivo principal</p><p className="font-medium text-slate-800">{money(data.objetivoPrincipal)}</p></div>
          <div><p className="text-xs text-slate-500">Fondo vacaciones</p><p className="font-medium text-slate-800">{money(data.fondoVacaciones)}</p></div>
          <div><p className="text-xs text-slate-500">Objetivo total</p><p className="font-semibold text-slate-900">{money(data.objetivoTotal)}</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-sm">
          <div><p className="text-xs text-slate-500">Ahorro acumulado</p><p className="font-medium text-emerald-700">{money(data.ahorroAcumulado)}</p></div>
          <div><p className="text-xs text-slate-500">Falta ahorrar</p><p className="font-medium text-slate-800">{money(data.faltaAhorrar)}</p></div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Progreso</span><span>{data.progreso}%</span></div>
          <ProgressBar percent={data.progreso} />
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <PiggyBank className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-slate-600">
            Ahorro diario necesario: <span className="font-semibold text-blue-700">{money(data.ahorroDiarioNecesario)}</span>
            {data.diasRestantes > 0 && <span className="text-xs text-slate-400"> · {data.diasRestantes} días restantes</span>}
          </p>
        </div>
        {data.objetivoVencido && <p className="text-xs text-rose-600 mt-2">⚠️ Objetivo vencido — todavía falta {money(data.faltaAhorrar)}.</p>}
        <p className="text-xs text-slate-400 mt-3">Se edita en Configuración.</p>
      </Card>

      {/* EVOLUCIÓN */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Evolución</p>
          <div className="flex gap-2">
            {(["week", "month", "history"] as EvoRange[]).map((r) => (
              <button key={r} onClick={() => setEvoRange(r)} className={`text-xs px-3 py-1 rounded-full font-medium ${evoRange === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
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
      </Card>
    </div>
  );
}
