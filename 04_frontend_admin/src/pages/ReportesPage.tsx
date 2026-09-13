import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card } from "../components/Card";
import { reportsService } from "../services/reportsService";
import { toCsv, downloadCsv } from "../utils/csv";

type TabKey = "ventas" | "gastos" | "financiero" | "pedidos" | "metas" | "ahorro" | "vacaciones";

const TABS: { key: TabKey; label: string }[] = [
  { key: "financiero", label: "Financiero" },
  { key: "ventas", label: "Ventas" },
  { key: "gastos", label: "Gastos" },
  { key: "pedidos", label: "Pedidos" },
  { key: "metas", label: "Metas" },
  { key: "ahorro", label: "Ahorro" },
  { key: "vacaciones", label: "Vacaciones" },
];

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50"
    >
      <Download className="h-3.5 w-3.5" /> Exportar CSV
    </button>
  );
}

// Section 32 — Reportes: Ventas, Gastos, Financiero, Pedidos, Metas, Ahorro, Vacaciones.
export function ReportesPage() {
  const [tab, setTab] = useState<TabKey>("financiero");
  const [loading, setLoading] = useState(true);

  const [financial, setFinancial] = useState<{ ingresos: number; gastos: number; ganancia: number } | null>(null);
  const [sales, setSales] = useState<{ id: string; date: string; total: number }[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsService.getFinancial().then(setFinancial),
      reportsService.getSales().then((r) => setSales(r.sales)),
      reportsService.getExpenses().then(setExpenses),
      reportsService.getOrders().then(setOrders),
      reportsService.getGoals().then(setGoals),
      reportsService.getSavings().then(setSavings),
      reportsService.getVacations().then(setVacations),
    ]).finally(() => setLoading(false));
  }, []);

  function exportSales() {
    const csv = toCsv(sales, [
      { key: "date", label: "Fecha" },
      { key: "total", label: "Total" },
    ]);
    downloadCsv("ventas.csv", csv);
  }
  function exportExpenses() {
    const rows = expenses.map((e) => ({ ...e, categoria: e.category?.name ?? "" }));
    const csv = toCsv(rows, [
      { key: "concept", label: "Concepto" },
      { key: "categoria", label: "Categoría" },
      { key: "amount", label: "Monto" },
      { key: "periodicity", label: "Periodicidad" },
      { key: "date", label: "Fecha" },
    ]);
    downloadCsv("gastos.csv", csv);
  }
  function exportOrders() {
    const rows = orders.map((o) => ({ estado: o.status, cantidad: o._count._all, total: o._sum.total ?? 0 }));
    const csv = toCsv(rows, [
      { key: "estado", label: "Estado" },
      { key: "cantidad", label: "Cantidad" },
      { key: "total", label: "Total" },
    ]);
    downloadCsv("pedidos.csv", csv);
  }
  function exportGoals() {
    const rows = goals.map((g) => ({
      nombre: g.name,
      objetivo: g.targetValue,
      acumulado: g.currentValue,
      cumplimiento: g.targetValue > 0 ? `${Math.round((g.currentValue / g.targetValue) * 100)}%` : "0%",
    }));
    const csv = toCsv(rows, [
      { key: "nombre", label: "Meta" },
      { key: "objetivo", label: "Objetivo" },
      { key: "acumulado", label: "Acumulado" },
      { key: "cumplimiento", label: "Cumplimiento" },
    ]);
    downloadCsv("metas.csv", csv);
  }
  function exportSavings() {
    const csv = toCsv(savings, [
      { key: "label", label: "Etiqueta" },
      { key: "amount", label: "Monto" },
      { key: "date", label: "Fecha" },
    ]);
    downloadCsv("ahorro.csv", csv);
  }
  function exportVacations() {
    const rows = vacations.map((v) => ({
      nombre: v.name,
      objetivo: v.targetAmount,
      ahorrado: v.currentSavings,
      faltante: Math.max(0, v.targetAmount - v.currentSavings),
    }));
    const csv = toCsv(rows, [
      { key: "nombre", label: "Periodo" },
      { key: "objetivo", label: "Objetivo" },
      { key: "ahorrado", label: "Ahorrado" },
      { key: "faltante", label: "Faltante" },
    ]);
    downloadCsv("vacaciones.csv", csv);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Reportes financieros</h2>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${
              tab === t.key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Cargando reportes…</p>
      ) : (
        <>
          {tab === "financiero" && financial && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <p className="text-xs text-slate-500">Ingresos totales</p>
                <p className="text-xl font-semibold text-emerald-700">${financial.ingresos.toLocaleString("es-MX")}</p>
              </Card>
              <Card>
                <p className="text-xs text-slate-500">Gastos totales</p>
                <p className="text-xl font-semibold text-rose-700">${financial.gastos.toLocaleString("es-MX")}</p>
              </Card>
              <Card>
                <p className="text-xs text-slate-500">Ganancia</p>
                <p className="text-xl font-semibold text-blue-700">${financial.ganancia.toLocaleString("es-MX")}</p>
              </Card>
            </div>
          )}

          {tab === "ventas" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Ventas registradas</p>
                <ExportButton onClick={exportSales} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-600">{new Date(s.date).toLocaleDateString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-700">${s.total.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-slate-400 py-4">
                        Sin ventas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === "gastos" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Gastos registrados</p>
                <ExportButton onClick={exportExpenses} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Concepto</th>
                    <th className="py-2 pr-4 font-medium">Categoría</th>
                    <th className="py-2 pr-4 font-medium">Monto</th>
                    <th className="py-2 pr-4 font-medium">Periodicidad</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{e.concept}</td>
                      <td className="py-2 pr-4 text-slate-500">{e.category?.name ?? "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">${e.amount.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-500">{e.periodicity}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-400 py-4">
                        Sin gastos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === "pedidos" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Pedidos por estado</p>
                <ExportButton onClick={exportOrders} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Cantidad</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{o.status}</td>
                      <td className="py-2 pr-4 text-slate-500">{o._count._all}</td>
                      <td className="py-2 pr-4 text-slate-700">${(o._sum.total ?? 0).toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-400 py-4">
                        Sin pedidos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === "metas" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Metas</p>
                <ExportButton onClick={exportGoals} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Meta</th>
                    <th className="py-2 pr-4 font-medium">Objetivo</th>
                    <th className="py-2 pr-4 font-medium">Acumulado</th>
                    <th className="py-2 pr-4 font-medium">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{g.name}</td>
                      <td className="py-2 pr-4 text-slate-500">${g.targetValue.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-500">${g.currentValue.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                  {goals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-400 py-4">
                        Sin metas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === "ahorro" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Movimientos de ahorro</p>
                <ExportButton onClick={exportSavings} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Etiqueta</th>
                    <th className="py-2 pr-4 font-medium">Monto</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {savings.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{s.label}</td>
                      <td className="py-2 pr-4 text-slate-500">${s.amount.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-500">{new Date(s.date).toLocaleDateString("es-MX")}</td>
                    </tr>
                  ))}
                  {savings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-400 py-4">
                        Sin movimientos de ahorro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {tab === "vacaciones" && (
            <Card>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-slate-700">Fondos de vacaciones</p>
                <ExportButton onClick={exportVacations} />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-4 font-medium">Periodo</th>
                    <th className="py-2 pr-4 font-medium">Objetivo</th>
                    <th className="py-2 pr-4 font-medium">Ahorrado</th>
                    <th className="py-2 pr-4 font-medium">Faltante</th>
                  </tr>
                </thead>
                <tbody>
                  {vacations.map((v) => (
                    <tr key={v.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{v.name}</td>
                      <td className="py-2 pr-4 text-slate-500">${v.targetAmount.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-500">${v.currentSavings.toLocaleString("es-MX")}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        ${Math.max(0, v.targetAmount - v.currentSavings).toLocaleString("es-MX")}
                      </td>
                    </tr>
                  ))}
                  {vacations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-400 py-4">
                        Sin periodos de vacaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
