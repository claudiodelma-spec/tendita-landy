import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { PeriodicityBadge } from "../components/PeriodicityBadge";
import { financeService } from "../services/financeService";
import type { Periodicity, Rent } from "../types/finance";

const PERIODICITIES: Periodicity[] = ["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO"];

// Section 11 — Renta: histórico conservado (BN-001). Este panel nunca edita un
// registro existente para cambiar su valor: crea uno nuevo y cierra el anterior,
// preservando el histórico tal como pide la sección 11 del spec.
export function RentaPage() {
  const [rents, setRents] = useState<Rent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    concept: "Renta local escolar",
    value: "",
    periodicity: "SEMANAL" as Periodicity,
    startDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  function load() {
    setLoading(true);
    financeService.listRents().then(setRents).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const active = rents.find((r) => r.status === "ACTIVE");
    if (active) {
      // Close the previous rent period instead of overwriting it (BN-001 history).
      await financeService.updateRent(active.id, {
        status: "INACTIVE",
        endDate: form.startDate,
      });
    }
    await financeService.createRent({
      concept: form.concept,
      value: Number(form.value),
      periodicity: form.periodicity,
      startDate: form.startDate,
      notes: form.notes || undefined,
      status: "ACTIVE",
    });
    setModalOpen(false);
    load();
  }

  const active = rents.find((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Rentas</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo periodo de renta
        </button>
      </div>

      {active && (
        <Card className="bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-500 mb-1">Renta activa</p>
          <p className="text-xl font-semibold text-blue-800">
            ${active.value.toLocaleString("es-MX")} <PeriodicityBadge value={active.periodicity} />
          </p>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : (
          <DataTable
            rows={rents}
            emptyMessage="Aún no hay periodos de renta registrados."
            columns={[
              { header: "Concepto", render: (r) => r.concept ?? "Renta" },
              { header: "Valor", render: (r) => `$${r.value.toLocaleString("es-MX")}` },
              { header: "Periodicidad", render: (r) => <PeriodicityBadge value={r.periodicity} /> },
              { header: "Desde", render: (r) => new Date(r.startDate).toLocaleDateString("es-MX") },
              {
                header: "Hasta",
                render: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString("es-MX") : "—"),
              },
              {
                header: "Estado",
                render: (r) => (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.status === "ACTIVE" ? "Activo" : "Histórico"}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Card>

      <Modal open={modalOpen} title="Nuevo periodo de renta" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Concepto</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Periodicidad</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.periodicity}
              onChange={(e) => setForm({ ...form, periodicity: e.target.value as Periodicity })}
            >
              {PERIODICITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Vigente desde</label>
            <input
              type="date"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notas</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
