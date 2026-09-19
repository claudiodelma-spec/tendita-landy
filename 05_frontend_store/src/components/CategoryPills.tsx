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
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          selected === null ? "bg-gradient-to-r from-pink-600 to-fuchsia-500 text-white shadow-md shadow-pink-200" : "bg-white/80 text-fuchsia-700 border border-pink-100"
        }`}
      >
        Todos
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
            selected === c.id ? "bg-gradient-to-r from-pink-600 to-fuchsia-500 text-white shadow-md shadow-pink-200" : "bg-white/80 text-fuchsia-700 border border-pink-100"
          }`}
        >
          <span>{c.icon ?? "🏷️"}</span> {c.name}
        </button>
      ))}
    </div>
  );
}
