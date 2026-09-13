import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@tenditalandy.demo");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-10 w-10 rounded-full bg-orange-400 flex items-center justify-center text-slate-900 font-bold">
            TL
          </span>
          <div>
            <p className="font-semibold text-slate-900">Tendita Landy</p>
            <p className="text-xs text-amber-600">🧪 Entorno SANDBOX</p>
          </div>
        </div>

        <label className="block text-sm text-slate-600 mb-1">Correo</label>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <label className="block text-sm text-slate-600 mb-1">Contraseña</label>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 mb-4 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Demo: admin@tenditalandy.demo · gestion@… · operador@… · padre@… — contraseña <b>Demo1234!</b>
        </p>
      </form>
    </div>
  );
}
