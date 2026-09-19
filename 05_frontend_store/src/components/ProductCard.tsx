import React from "react";
import { Plus } from "lucide-react";
import type { Product } from "../types/store";

const PALETTE = [
  { bg: "from-pink-200 to-rose-100", accent: "bg-pink-600" },
  { bg: "from-amber-200 to-orange-100", accent: "bg-orange-500" },
  { bg: "from-emerald-200 to-teal-100", accent: "bg-emerald-600" },
  { bg: "from-sky-200 to-blue-100", accent: "bg-sky-600" },
  { bg: "from-violet-200 to-purple-100", accent: "bg-violet-600" },
];

function paletteFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const palette = paletteFor(product.id);
  return (
    <div className="bg-white rounded-2xl border-2 border-white shadow-md shadow-slate-200/60 overflow-hidden flex flex-col transition-transform active:scale-[0.97] hover:-translate-y-0.5">
      <div className={`h-24 bg-gradient-to-br ${palette.bg} flex items-center justify-center overflow-hidden`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 flex-1">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-extrabold text-slate-900">${product.price}</span>
          <button
            onClick={() => onAdd(product)}
            className={`h-8 w-8 rounded-full ${palette.accent} text-white flex items-center justify-center hover:brightness-110 active:scale-90 transition-transform shadow-md`}
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
