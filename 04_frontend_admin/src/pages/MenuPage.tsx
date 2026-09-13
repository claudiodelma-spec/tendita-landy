import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { storeService } from "../services/storeService";
import type { DailyMenu } from "../types/store";

// Section 24 — Menú diario: crear/editar/eliminar/activar/desactivar/programar por fecha.
export function MenuPage() {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [itemsText, setItemsText] = useState("🌮 Tacos\n🥤 Agua de jamaica\n🍎 Fruta");

  function load() {
    storeService.listMenus().then(setMenus);
  }
  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const items = itemsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label, order) => ({ label, order }));
    await storeService.createMenu({ date, active: true, items });
    setModalOpen(false);
    load();
  }

  async function toggleActive(menu: DailyMenu) {
    await storeService.setMenuActive(menu.id, !menu.active);
    load();
  }

  async function remove(id: string) {
    await storeService.deleteMenu(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Menú Diario</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Nuevo menú
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menus.map((m) => (
          <Card key={m.id}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-slate-800">{new Date(m.date).toLocaleDateString("es-MX")}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(m)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.active ? "Activo" : "Inactivo"}
                </button>
                <button onClick={() => remove(m.id)} className="text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ul className="text-sm text-slate-600 space-y-1">
              {m.items.map((it) => (
                <li key={it.id}>{it.label}</li>
              ))}
            </ul>
          </Card>
        ))}
        {menus.length === 0 && <p className="text-sm text-slate-400 col-span-2">Aún no hay menús configurados.</p>}
      </div>

      <Modal open={modalOpen} title="Nuevo menú diario" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha</label>
            <input
              type="date"
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Platillos (uno por línea, con emoji)</label>
            <textarea
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
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
