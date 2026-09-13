import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ShoppingBag, ClipboardList, User } from "lucide-react";

// Section 38 — Tienda: navegación siempre accesible, botones grandes, mobile first.
const ITEMS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/productos", label: "Productos", icon: ShoppingBag },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] flex justify-around py-2 z-40">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs ${
                isActive ? "text-pink-600" : "text-slate-400"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
