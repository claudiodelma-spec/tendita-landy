import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { storeService } from "../services/storeService";

// Section 28/29/30 — datos del alumno → confirmar pedido → mensaje de
// WhatsApp. Público, sin login: el pedido se identifica por el nombre del
// alumno, no por una cuenta.
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
      <div className="px-5 py-14 text-center space-y-5">
        <p className="text-5xl">🎉</p>
        <p className="text-xl font-bold text-slate-900">¡Pedido listo!</p>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Ahora confírmalo enviándolo por WhatsApp — solo falta ese último paso.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 text-white rounded-2xl px-7 py-3.5 text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
        >
          <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
        </a>
        <button onClick={() => navigate("/")} className="block mx-auto text-sm text-slate-400 mt-4">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-sm text-slate-400">Tu carrito está vacío.</p>
        <button onClick={() => navigate("/productos")} className="mt-3 text-sm text-pink-600 font-semibold">
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 space-y-4">
      <p className="text-xl font-bold text-slate-900">Tu pedido</p>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 shadow-sm">
        {lines.map((l) => (
          <div key={l.product.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                {l.product.imageUrl ? (
                  <img src={l.product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">🍽️</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{l.product.name}</p>
                <p className="text-xs text-slate-400">${l.product.price} c/u</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(l.product.id, l.quantity - 1)} className="text-slate-400 h-7 w-7 flex items-center justify-center">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm w-4 text-center font-medium">{l.quantity}</span>
              <button onClick={() => setQuantity(l.product.id, l.quantity + 1)} className="text-slate-400 h-7 w-7 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </button>
              <button onClick={() => remove(l.product.id)} className="text-rose-400 ml-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-bold text-slate-700">Total</span>
          <span className="text-base font-bold text-slate-900">${total}</span>
        </div>
      </div>

      <form onSubmit={handleConfirm} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">Datos del alumno</p>
        <input
          required
          placeholder="Nombre del alumno"
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
          value={student.name}
          onChange={(e) => setStudent({ ...student, name: e.target.value })}
        />
        <input
          required
          placeholder="Grado (ej. 2º secundaria)"
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
          value={student.grade}
          onChange={(e) => setStudent({ ...student, grade: e.target.value })}
        />
        <input
          placeholder="Grupo (opcional)"
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
          value={student.group}
          onChange={(e) => setStudent({ ...student, group: e.target.value })}
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="h-4 w-4" /> {loading ? "Enviando..." : "Pedir por WhatsApp"}
        </button>
      </form>
    </div>
  );
}
