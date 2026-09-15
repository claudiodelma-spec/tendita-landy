import React from "react";
import type { Category } from "../types/store";

export function CategoryPills({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selected === null ? "bg-pink-600 text-white shadow-sm shadow-pink-200" : "bg-white text-slate-600 border border-slate-200"
        }`}
      >
        Todos
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
            selected === c.id ? "bg-pink-600 text-white shadow-sm shadow-pink-200" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          <span>{c.icon ?? "🏷️"}</span> {c.name}
        </button>
      ))}
    </div>
  );
}
