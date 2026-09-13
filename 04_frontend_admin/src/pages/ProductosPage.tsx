import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { DataTable } from "../components/DataTable";
import { storeService } from "../services/storeService";
import type { Category, Product } from "../types/store";

// Section 26 — Productos: NUNCA stock/inventario/cantidad. Solo ACTIVO/INACTIVO.
export function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", categoryId: "", description: "" });

  function load() {
    storeService.listProducts().then(setProducts);
    storeService.listCategories().then(setCategories);
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await storeService.createProduct({
      name: form.name,
      price: Number(form.price),
      categoryId: form.categoryId,
      description: form.description || undefined,
      status: "ACTIVO",
    });
    setModalOpen(false);
    setForm({ name: "", price: "", categoryId: "", description: "" });
    load();
  }

  async function toggleStatus(p: Product) {
    await storeService.updateProduct(p.id, { status: p.status === "ACTIVO" ? "INACTIVO" : "ACTIVO" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Productos</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      <Card>
        <DataTable
          rows={products}
          emptyMessage="Aún no hay productos."
          columns={[
            { header: "Nombre", render: (p) => p.name },
            {
              header: "Categoría",
              render: (p) => p.category?.name ?? categories.find((c) => c.id === p.categoryId)?.name ?? "—",
            },
            { header: "Precio", render: (p) => `$${p.price.toLocaleString("es-MX")}` },
            {
              header: "Disponibilidad",
              render: (p) => (
                <button
                  onClick={() => toggleStatus(p)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "ACTIVO" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {p.status === "ACTIVO" ? "Activo" : "Inactivo"}
                </button>
              ),
            },
          ]}
        />
      </Card>

      <Modal open={modalOpen} title="Nuevo producto" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            required
            placeholder="Nombre"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            required
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            required
            placeholder="Precio"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <textarea
            placeholder="Descripción (opcional)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
