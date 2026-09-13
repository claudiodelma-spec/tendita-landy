import React from "react";
import { Plus } from "lucide-react";
import type { Product } from "../types/store";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex flex-col">
      <div className="h-20 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-3xl mb-2">
        🍽️
      </div>
      <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-sm font-semibold text-slate-700">${product.price}</span>
        <button
          onClick={() => onAdd(product)}
          className="h-7 w-7 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
