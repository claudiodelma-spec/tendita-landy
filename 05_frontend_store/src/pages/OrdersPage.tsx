import React, { useEffect, useState } from "react";
import { storeService } from "../services/storeService";
import type { Order, OrderStatus } from "../types/store";

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

// Section 6 — Padre: "Historial de pedidos" (el backend filtra a los pedidos
// del usuario autenticado; ver la corrección en 03_backend/src/routes/orders.ts).
export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    storeService.listMyOrders().then(setOrders);
  }, []);

  return (
    <div className="px-4 space-y-3">
      <p className="text-lg font-semibold text-slate-800">Mis pedidos</p>
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex justify-between items-start mb-1">
            <p className="text-sm font-medium text-slate-700">Pedido #{o.number}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
              {STATUS_LABELS[o.status]}
            </span>
          </div>
          <p className="text-xs text-slate-400">{new Date(o.date).toLocaleString("es-MX")}</p>
          <p className="text-xs text-slate-500 mt-1">
            {o.items.map((it) => `${it.quantity}x ${it.product?.name ?? "Producto"}`).join(", ")}
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-2">${o.total}</p>
        </div>
      ))}
      {orders.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Aún no tienes pedidos.</p>}
    </div>
  );
}
