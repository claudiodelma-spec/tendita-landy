import React from "react";
import type { DailyMenu } from "../types/store";

export function DailyMenuBanner({ menu }: { menu: DailyMenu | null }) {
  if (!menu || !menu.active || menu.items.length === 0) return null;
  return (
    <div className="mx-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <p className="text-xs text-amber-600 font-medium mb-1">
        Menú de hoy · {new Date(menu.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
      </p>
      <ul className="text-sm text-slate-700 space-y-0.5">
        {menu.items.map((it) => (
          <li key={it.id}>{it.label}</li>
        ))}
      </ul>
    </div>
  );
}
