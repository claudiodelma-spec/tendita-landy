import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  if (itemCount === 0 || location.pathname === "/checkout") return null;

  return (
    <button
      onClick={() => navigate("/checkout")}
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-pink-600 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl shadow-pink-300/50 z-40 active:scale-[0.98] transition-transform"
    >
      <span className="text-sm font-medium">{itemCount} producto{itemCount > 1 ? "s" : ""}</span>
      <span className="text-sm font-bold">Ver carrito · ${total}</span>
    </button>
  );
}
