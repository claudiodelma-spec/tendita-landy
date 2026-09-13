import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Modal } from "../components/Modal";
import { ordersService } from "../services/ordersService";
import type { Order, OrderStatus } from "../types/orders";

const STATUS_FLOW: OrderStatus[] = ["RECIBIDO", "EN_PREPARACION", "LISTO", "ENTREGADO"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  RECIBIDO: "Recibido",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  RECIBIDO: "bg-blue-50 text-blue-700",
  EN_PREPARACION: "bg-amber-50 text-amber-700",
  LISTO: "bg-emerald-50 text-emerald-700",
  ENTREGADO: "bg-slate-100 text-slate-500",
  CANCELADO: "bg-rose-50 text-rose-700",
};

// Section 31 — Pedidos (admin): ver detalle, cambiar estado, cancelar, filtrar.
export function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    ordersService
      .list(statusFilter ? { status: statusFilter } : undefined)
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  async function changeStatus(order: Order, status: OrderStatus) {
    await ordersService.updateStatus(order.id, status);
    const refreshed = await ordersService.get(order.id);
    setSelected(refreshed);
    load();
  }

  const visible = orders.filter(
    (o) =>
      !search ||
      o.student.name.toLowerCase().includes(search.toLowerCase()) ||
      String(o.number).includes(search)
  );

  function nextStatus(current: OrderStatus): OrderStatus | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Pedidos</h2>
        <div className="flex gap-2">
          <input
            placeholder="Buscar por alumno o #pedido"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Alumno</th>
                  <th className="py-2 pr-4 font-medium">Grado</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-700">#{o.number}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{new Date(o.date).toLocaleString("es-MX")}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{o.student.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{o.student.grade}</td>
                    <td className="py-2.5 pr-4 text-slate-700">${o.total.toLocaleString("es-MX")}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-6">
                      No hay pedidos con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} title={selected ? `Pedido #${selected.number}` : ""} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">{selected.student.name}</span> · {selected.student.grade}
                {selected.student.group ? ` · ${selected.student.group}` : ""}
              </p>
              <p className="text-xs text-slate-400">{new Date(selected.date).toLocaleString("es-MX")}</p>
            </div>

            <ul className="text-sm divide-y divide-slate-50">
              {selected.items.map((it) => (
                <li key={it.id} className="flex justify-between py-1.5">
                  <span className="text-slate-600">
                    {it.quantity}x {it.product?.name ?? "Producto"}
                  </span>
                  <span className="text-slate-700">${it.subtotal.toLocaleString("es-MX")}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-100 pt-2">
              <span>Total</span>
              <span>${selected.total.toLocaleString("es-MX")}</span>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Estado actual: {STATUS_LABELS[selected.status]}</p>
              <div className="flex flex-wrap gap-2">
                {nextStatus(selected.status) && (
                  <button
                    onClick={() => changeStatus(selected, nextStatus(selected.status)!)}
                    className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Marcar como {STATUS_LABELS[nextStatus(selected.status)!]}
                  </button>
                )}
                {selected.status !== "ENTREGADO" && selected.status !== "CANCELADO" && (
                  <button
                    onClick={() => changeStatus(selected, "CANCELADO")}
                    className="bg-white border border-rose-200 text-rose-600 text-xs px-3 py-1.5 rounded-lg hover:bg-rose-50"
                  >
                    Cancelar pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
