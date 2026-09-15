import React from "react";
import { Plus } from "lucide-react";
import type { Product } from "../types/store";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-transform active:scale-[0.98]">
      <div className="h-24 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-medium text-slate-800 line-clamp-2 flex-1">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-slate-800">${product.price}</span>
          <button
            onClick={() => onAdd(product)}
            className="h-8 w-8 rounded-full bg-pink-600 text-white flex items-center justify-center hover:bg-pink-700 active:scale-90 transition-transform shadow-sm shadow-pink-200"
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
