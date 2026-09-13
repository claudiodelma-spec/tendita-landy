import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { PeriodicityBadge } from "../components/PeriodicityBadge";
import { financeService } from "../services/financeService";
import type { Expense, ExpenseCategory, Periodicity } from "../types/finance";

const PERIODICITIES: Periodicity[] = ["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "EXTRAORDINARIO"];

// Section 13 — Gastos, clasificados por categoría y periodicidad.
export function GastosPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [form, setForm] = useState({
    concept: "",
    categoryId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    periodicity: "MENSUAL" as Periodicity,
    description: "",
  });

  function load() {
    financeService.listExpenses().then(setExpenses);
    financeService.listExpenseCategories().then(setCategories);
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    let categoryId = form.categoryId;
    if (!categoryId && newCategory.trim()) {
      const cat = await financeService.createExpenseCategory(newCategory.trim());
      categoryId = cat.id;
    }
    await financeService.createExpense({
      concept: form.concept,
      categoryId,
      amount: Number(form.amount),
      date: form.date,
      periodicity: form.periodicity,
      description: form.description || undefined,
      status: "ACTIVE",
    });
    setModalOpen(false);
    setForm({ concept: "", categoryId: "", amount: "", date: new Date().toISOString().slice(0, 10), periodicity: "MENSUAL", description: "" });
    setNewCategory("");
    load();
  }

  const total = expenses.filter((e) => e.status === "ACTIVE").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Gastos</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo gasto
        </button>
      </div>

      <Card className="bg-rose-50 border-rose-100">
        <p className="text-xs text-rose-500 mb-1">Gastos activos (total)</p>
        <p className="text-2xl font-semibold text-rose-700">${total.toLocaleString("es-MX")}</p>
      </Card>

      <Card>
        <DataTable
          rows={expenses}
          emptyMessage="Aún no hay gastos registrados."
          columns={[
            { header: "Concepto", render: (e) => e.concept },
            { header: "Categoría", render: (e) => e.category?.name ?? categories.find((c) => c.id === e.categoryId)?.name ?? "—" },
            { header: "Monto", render: (e) => `$${e.amount.toLocaleString("es-MX")}` },
            { header: "Periodicidad", render: (e) => <PeriodicityBadge value={e.periodicity} /> },
            { header: "Fecha", render: (e) => new Date(e.date).toLocaleDateString("es-MX") },
            {
              header: "Estado",
              render: (e) => (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {e.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} title="Nuevo gasto" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Concepto</label>
            <input
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Categoría</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— Nueva categoría —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {!form.categoryId && (
              <input
                placeholder="Nombre de la nueva categoría"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
            <label className="block text-xs text-slate-500 mb-1">Fecha</label>
            <input
              type="date"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
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
