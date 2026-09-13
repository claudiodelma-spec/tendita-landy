import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { storeService } from "../services/storeService";
import type { Category } from "../types/store";

// Section 25 — Categorías: crear/editar/activar/desactivar/eliminar/reordenar.
export function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "" });

  function load() {
    storeService.listCategories().then((list) => setCategories(list.sort((a, b) => a.order - b.order)));
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await storeService.createCategory({ name: form.name, icon: form.icon || undefined, active: true });
    setModalOpen(false);
    setForm({ name: "", icon: "" });
    load();
  }

  async function toggleActive(cat: Category) {
    await storeService.updateCategory(cat.id, { active: !cat.active });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Categorías</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c) => (
          <Card key={c.id} className="text-center">
            <p className="text-3xl mb-2">{c.icon ?? "🏷️"}</p>
            <p className="font-medium text-slate-800">{c.name}</p>
            <button
              onClick={() => toggleActive(c)}
              className={`mt-3 text-xs px-3 py-1 rounded-full font-medium ${
                c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {c.active ? "Activa" : "Inactiva"}
            </button>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-sm text-slate-400 col-span-full">Aún no hay categorías.</p>}
      </div>

      <Modal open={modalOpen} title="Nueva categoría" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            required
            placeholder="Nombre (ej. Bebidas)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Icono/emoji (ej. 🥤)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
