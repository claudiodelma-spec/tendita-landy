import React from "react";
import type { DailyMenu } from "../types/store";

export function DailyMenuBanner({ menu }: { menu: DailyMenu | null }) {
  if (!menu || !menu.active || menu.items.length === 0) return null;
  return (
    <div className="mx-5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
      <p className="text-xs text-amber-600 font-semibold mb-1">
        🍱 Menú de hoy · {new Date(menu.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
      </p>
      <p className="text-sm text-slate-700">{menu.items.map((it) => it.label).join(" · ")}</p>
    </div>
  );
}
