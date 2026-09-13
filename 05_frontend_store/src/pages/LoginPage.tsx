import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("padre@tenditalandy.demo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="h-14 w-14 rounded-full bg-gradient-to-br from-pink-400 to-orange-300 flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
            TL
          </span>
          <p className="font-semibold text-slate-800">¡Hola! 👋</p>
          <p className="text-sm text-slate-400">¿Qué quieres pedir hoy?</p>
        </div>

        <label className="block text-sm text-slate-600 mb-1">Correo</label>
        <input
          className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
        <input
          className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-pink-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-pink-700 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Entrar a la tienda"}
        </button>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Demo: padre@tenditalandy.demo — contraseña <b>Demo1234!</b>
        </p>
      </form>
    </div>
  );
}
