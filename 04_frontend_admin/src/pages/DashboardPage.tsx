import React, { useEffect, useState } from "react";
import { PiggyBank, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { DashboardSummary } from "../types/finance";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Corrección "Dashboard financiero" — únicamente los 7 indicadores pedidos
// (sección 1): Ventas del día, Gastos del día, Ganancia neta, Objetivo total
// de ahorro, Ahorro diario necesario, Ahorro acumulado, Falta ahorrar.
// Total alumnos fue retirado por completo (sección 19).
export function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ventasDraft, setVentasDraft] = useState("");
  const [gastosDraft, setGastosDraft] = useState("");
  const [savingMsg, setSavingMsg] = useState<string | null>(null);

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

  async function saveVentas() {
    setSavingMsg(null);
    try {
      await financeService.upsertIncome(selectedDate, Number(ventasDraft));
      setSavingMsg("✓ Ventas del día guardadas");
      load(selectedDate);
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
    } catch (e: any) {
      setSavingMsg(e.message ?? "No se pudo guardar");
    }
  }

  if (error) {
    return (
      <Card className="text-sm text-rose-600">
        {error} — verifica que el backend esté corriendo en <code>VITE_API_URL</code>.
      </Card>
    );
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando dashboard…</p>;

  return (
    <div className="space-y-6">
      {/* Selector de fecha — sección 16 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Dashboard financiero</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* RESUMEN DEL DÍA */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Resumen del día</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ventas del día</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                value={ventasDraft}
                onChange={(e) => setVentasDraft(e.target.value)}
              />
              <button
                onClick={saveVentas}
                className="text-xs bg-emerald-600 text-white px-3 rounded-lg hover:bg-emerald-700 shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Gastos del día</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                value={gastosDraft}
                onChange={(e) => setGastosDraft(e.target.value)}
              />
              <button
                onClick={saveGastos}
                className="text-xs bg-rose-600 text-white px-3 rounded-lg hover:bg-rose-700 shrink-0"
              >
                Guardar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ganancia neta (automático)</label>
            <p
              className={`text-lg font-semibold pt-1.5 ${data.gananciaNeta >= 0 ? "text-blue-700" : "text-rose-600"}`}
            >
              {money(data.gananciaNeta)}
            </p>
          </div>
        </div>
        {savingMsg && <p className="text-xs text-slate-500">{savingMsg}</p>}
      </Card>

      {/* Ganancia neta vs. ahorro necesario — sección 8 */}
      <Card
        className={
          data.deficit > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
        }
      >
        <div className="flex items-start gap-3">
          {data.deficit > 0 ? (
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            {data.deficit > 0 ? (
              <p className="text-rose-700">
                Déficit del día: <b>{money(data.deficit)}</b> — la ganancia neta no alcanza el ahorro diario
                necesario. Puedes registrar el ahorro real que consideres posible.
              </p>
            ) : (
              <p className="text-emerald-700">
                Ahorro recomendado hoy: <b>{money(data.ahorroRecomendado)}</b> — disponible después de ahorrar:{" "}
                <b>{money(data.disponibleDespues)}</b>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* OBJETIVO DE AHORRO */}
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Objetivo de ahorro</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Objetivo principal</p>
            <p className="font-medium text-slate-800">{money(data.objetivoPrincipal)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Fondo vacaciones</p>
            <p className="font-medium text-slate-800">{money(data.fondoVacaciones)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Objetivo total</p>
            <p className="font-semibold text-slate-900">{money(data.objetivoTotal)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Ahorro acumulado</p>
            <p className="font-medium text-emerald-700">{money(data.ahorroAcumulado)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Falta ahorrar</p>
            <p className="font-medium text-slate-800">{money(data.faltaAhorrar)}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progreso</span>
            <span>{data.progreso}%</span>
          </div>
          <ProgressBar percent={data.progreso} />
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <PiggyBank className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-slate-600">
            Ahorro diario necesario:{" "}
            <span className="font-semibold text-blue-700">{money(data.ahorroDiarioNecesario)}</span>
            {data.diasRestantes > 0 && (
              <span className="text-xs text-slate-400"> · {data.diasRestantes} días restantes</span>
            )}
          </p>
        </div>
        {data.objetivoVencido && (
          <p className="text-xs text-rose-600 mt-2">
            ⚠️ Objetivo vencido — todavía falta {money(data.faltaAhorrar)} y la fecha objetivo ya pasó.
          </p>
        )}
        <p className="text-xs text-slate-400 mt-3">
          Editar el objetivo principal, el fondo de vacaciones y las fechas en Configuración.
        </p>
      </Card>
    </div>
  );
}
