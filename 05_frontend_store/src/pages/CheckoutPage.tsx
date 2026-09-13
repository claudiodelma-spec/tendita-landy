import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { storeService } from "../services/storeService";

// Section 28/29/30 — datos del alumno → confirmar pedido → mensaje de WhatsApp.
export function CheckoutPage() {
  const { lines, setQuantity, remove, total, clear } = useCart();
  const navigate = useNavigate();
  const [student, setStudent] = useState({ name: "", grade: "", group: "" });
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await storeService.createOrder({
        student: { name: student.name, grade: student.grade, group: student.group || undefined },
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      setWhatsappUrl(result.whatsappUrl);
      clear();
    } catch (err: any) {
      setError(err.message ?? "No se pudo crear el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (whatsappUrl) {
    return (
      <div className="px-4 py-10 text-center space-y-4">
        <p className="text-4xl">🎉</p>
        <p className="font-semibold text-slate-800">¡Pedido creado!</p>
        <p className="text-sm text-slate-500">Confirma tu pedido enviándolo por WhatsApp.</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-emerald-500 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-emerald-600"
        >
          Enviar por WhatsApp
        </a>
        <button onClick={() => navigate("/")} className="block mx-auto text-sm text-slate-400 mt-4">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-slate-400">Tu carrito está vacío.</p>
        <button onClick={() => navigate("/")} className="mt-3 text-sm text-pink-600 font-medium">
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      <p className="text-lg font-semibold text-slate-800">Resumen del pedido</p>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
        {lines.map((l) => (
          <div key={l.product.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">{l.product.name}</p>
              <p className="text-xs text-slate-400">${l.product.price} c/u</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(l.product.id, l.quantity - 1)} className="text-slate-400">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm w-4 text-center">{l.quantity}</span>
              <button onClick={() => setQuantity(l.product.id, l.quantity + 1)} className="text-slate-400">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => remove(l.product.id)} className="text-rose-400 ml-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-sm font-semibold text-slate-900">${total}</span>
        </div>
      </div>

      <form onSubmit={handleConfirm} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700">Datos del alumno</p>
        <input
          required
          placeholder="Nombre del alumno"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={student.name}
          onChange={(e) => setStudent({ ...student, name: e.target.value })}
        />
        <input
          required
          placeholder="Grado (ej. 2º secundaria)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={student.grade}
          onChange={(e) => setStudent({ ...student, grade: e.target.value })}
        />
        <input
          placeholder="Grupo (opcional)"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          value={student.group}
          onChange={(e) => setStudent({ ...student, group: e.target.value })}
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Pedir por WhatsApp"}
        </button>
      </form>
    </div>
  );
}
