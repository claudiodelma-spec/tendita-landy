import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export function CartBar() {
  const { itemCount, total } = useCart();
  const navigate = useNavigate();
  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => navigate("/checkout")}
      className="fixed bottom-20 left-4 right-4 bg-pink-600 text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg z-40"
    >
      <span className="text-sm font-medium">{itemCount} producto(s)</span>
      <span className="text-sm font-semibold">Ver carrito · ${total}</span>
    </button>
  );
}
