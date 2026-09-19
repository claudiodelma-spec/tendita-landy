import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "../hooks/useCart";

// Tienda pública, sin cuentas: solo Inicio, Productos y Carrito.
const ITEMS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/productos", label: "Productos", icon: ShoppingBag },
  { to: "/checkout", label: "Carrito", icon: ShoppingCart },
];

export function BottomNav() {
  const { itemCount } = useCart();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex justify-around py-2 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive ? "text-pink-600 bg-pink-50" : "text-slate-400"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {item.label}
            {item.to === "/checkout" && itemCount > 0 && (
              <span className="absolute -top-0.5 right-2 h-4 min-w-4 px-1 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center font-semibold">
                {itemCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
