import React, { useEffect, useState } from "react";
import { Wallet, Building2, ShoppingBag, Users2, PiggyBank } from "lucide-react";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { financeService } from "../services/financeService";
import type { DashboardSummary } from "../types/finance";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message ?? "No se pudo cargar el dashboard"));
  }, []);

  if (error) {
    return (
      <Card className="text-sm text-rose-600">
        {error} — verifica que el backend esté corriendo en <code>VITE_API_URL</code>.
      </Card>
    );
  }
  if (!data) return <p className="text-sm text-slate-400">Cargando dashboard…</p>;

  const metricCards = [
    { icon: Wallet, bg: "bg-emerald-500", label: "Ventas del día", value: money(data.ventasHoy) },
    { icon: Building2, bg: "bg-blue-500", label: "Ganancia neta", value: money(data.gananciaNeta) },
    { icon: ShoppingBag, bg: "bg-rose-500", label: "Gastos del día", value: money(data.gastosHoy) },
    { icon: Users2, bg: "bg-violet-500", label: "Total alumnos", value: String(data.totalAlumnos) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((c) => (
          <Card key={c.label}>
            <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.bg} mb-3`}>
              <c.icon className="h-5 w-5 text-white" />
            </span>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-slate-500">Ahorro diario necesario (BN-004)</p>
          </div>
          <p className="text-2xl font-semibold text-blue-700">
            {money(data.ahorroDiario.ahorroDiarioNecesario)}{" "}
            <span className="text-sm font-normal text-slate-400">/ día</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Faltante total: {money(data.ahorroDiario.necesidadRestante)} · {data.ahorroDiario.diasRestantes} días
            restantes
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 mb-3">Metas activas</p>
          <div className="space-y-3">
            {data.metas.length === 0 && <p className="text-xs text-slate-400">Sin metas activas.</p>}
            {data.metas.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{g.name}</span>
                  <span className="text-slate-400">
                    {money(g.currentValue)} / {money(g.targetValue)}
                  </span>
                </div>
                <ProgressBar percent={(g.currentValue / g.targetValue) * 100} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-slate-500 mb-3">Fondos de vacaciones</p>
          <div className="space-y-3">
            {data.vacaciones.length === 0 && <p className="text-xs text-slate-400">Sin periodos configurados.</p>}
            {data.vacaciones.map((v) => (
              <div key={v.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{v.name}</span>
                  <span className="text-slate-400">
                    {money(v.currentSavings)} / {money(v.targetAmount)}
                  </span>
                </div>
                <ProgressBar percent={(v.currentSavings / v.targetAmount) * 100} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
