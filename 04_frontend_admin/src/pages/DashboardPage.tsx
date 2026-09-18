import React, { useEffect, useState } from "react";
import { PiggyBank, TrendingUp, Palmtree } from "lucide-react";
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

// Ajuste posterior del usuario sobre la corrección "Dashboard financiero":
// - Resumen del día + historial de Ventas/Gastos (para ver la evolución)
// - Ahorro para gastos operativos: Renta + Nómina + Gastos fijos + Gastos
//   del día (últimos 7 días) — fórmula corregida a pedido explícito
// - Meta de ganancia (sin cambios)
// - Ahorro para vacaciones: reemplaza el cartón viejo basado en Settings por
//   uno que lee el periodo de vacaciones real (pantalla Vacaciones, sin tocar)
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
  function loadEvolution() {
    financeService.getEvolution(evoRange).then((r) => setEvolution(r.series));
  }
  useEffect(() => load(selectedDate), [selectedDate]);
  useEffect(loadEvolution, [evoRange]);

  async function saveVentas() {
    setSavingMsg(null);
    try {
      await financeService.upsertIncome(selectedDate, Number(ventasDraft));
      setSavingMsg("✓ Ventas del día guardadas");
      load(selectedDate);
      loadEvolution();
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
    } catch (e: any) {
      setSavingMsg(e.message ?? "No se pudo guardar");
    }
  }

  if (error) {
    return <Card className="text-sm text-rose-600">{error} — verifica que el backend esté corriendo en <code>VITE_API_URL</code>.</Card>;
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando dashboard…</p>;

  const historyRows = [...evolution].reverse(); // más reciente primero

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

      {/* HISTORIAL — evolución día por día */}
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

        <div className="overflow-x-auto mt-4 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Ventas</th>
                <th className="py-2 pr-4 font-medium">Gastos</th>
                <th className="py-2 pr-4 font-medium">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={row.fecha} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 text-slate-600">{row.fecha}</td>
                  <td className="py-1.5 pr-4 text-emerald-700">{money(row.ventas)}</td>
                  <td className="py-1.5 pr-4 text-rose-600">{money(row.gastos)}</td>
                  <td className={`py-1.5 pr-4 font-medium ${row.ganancia >= 0 ? "text-blue-700" : "text-rose-700"}`}>{money(row.ganancia)}</td>
                </tr>
              ))}
              {historyRows.length === 0 && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-4">Sin registros todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AHORRO PARA GASTOS OPERATIVOS */}
      <Card className="bg-indigo-50 border-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <PiggyBank className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-medium text-indigo-700">Ahorro para gastos operativos</p>
        </div>
        <p className="text-xs text-indigo-500 mb-3">Renta + Nómina + Gastos fijos + Gastos del día (últimos 7 días)</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mb-3">
          <div><p className="text-indigo-400">Renta/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.rentaSemanal)}</p></div>
          <div><p className="text-indigo-400">Nómina/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.nominaSemanal)}</p></div>
          <div><p className="text-indigo-400">Gastos fijos/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.gastosFijosSemanal)}</p></div>
          <div><p className="text-indigo-400">Gastos del día (7d)</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.gastosDiaSemanal)}</p></div>
          <div><p className="text-indigo-400">Total/sem</p><p className="font-semibold text-indigo-800">{money(data.gastosOperativos.pagosSemanales)}</p></div>
        </div>
        <p className="text-xl font-bold text-indigo-800">
          {money(data.gastosOperativos.ahorroDiarioNecesario)} <span className="text-xs font-normal text-indigo-400">/ día</span>
        </p>
        <p className="text-xs text-indigo-400 mt-1">Renta y Gastos fijos se editan en "Renta, Nómina y Gastos"; Gastos del día arriba en Resumen del día.</p>
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

      {/* AHORRO PARA VACACIONES */}
      <Card className="bg-sky-50 border-sky-100">
        <div className="flex items-center gap-2 mb-1">
          <Palmtree className="h-4 w-4 text-sky-600" />
          <p className="text-sm font-medium text-sky-700">Ahorro para vacaciones</p>
        </div>
        {data.vacacionesResumen.hasPeriod ? (
          <>
            <p className="text-xs text-sky-500 mb-3">
              Próximo periodo: <b>{data.vacacionesResumen.name}</b> · {new Date(data.vacacionesResumen.startDate).toLocaleDateString("es-MX")} — {new Date(data.vacacionesResumen.endDate).toLocaleDateString("es-MX")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-1">
              <div><p className="text-xs text-sky-500">Objetivo</p><p className="font-semibold text-sky-800">{money(data.vacacionesResumen.targetAmount)}</p></div>
              <div><p className="text-xs text-sky-500">Ahorrado</p><p className="font-semibold text-sky-800">{money(data.vacacionesResumen.currentSavings)}</p></div>
              <div><p className="text-xs text-sky-500">Falta</p><p className="font-semibold text-sky-800">{money(data.vacacionesResumen.faltante)}</p></div>
            </div>
            <p className="text-xl font-bold text-sky-800 mt-2">
              {money(data.vacacionesResumen.ahorroDiarioNecesario)} <span className="text-xs font-normal text-sky-400">/ día durante {data.vacacionesResumen.diasRestantes} días</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-sky-600">Aún no hay periodos de vacaciones configurados.</p>
        )}
        <p className="text-xs text-sky-400 mt-2">Se administra en la pantalla Vacaciones.</p>
      </Card>
    </div>
  );
}
