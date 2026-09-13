import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { user, logout } = useAuth();
  return (
    <div className="px-4 space-y-4">
      <p className="text-lg font-semibold text-slate-800">Perfil</p>
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-sm font-medium text-slate-700">{user?.name ?? user?.email}</p>
        <p className="text-xs text-slate-400">{user?.email}</p>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-rose-600 rounded-xl py-3 text-sm font-medium"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  );
}
