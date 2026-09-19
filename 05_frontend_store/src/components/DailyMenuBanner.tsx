import React from "react";
import type { DailyMenu } from "../types/store";

export function DailyMenuBanner({ menu }: { menu: DailyMenu | null }) {
  if (!menu || !menu.active || menu.items.length === 0) return null;
  return (
    <div className="mx-5 bg-gradient-to-r from-amber-100 to-yellow-50 border-2 border-amber-200 rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-xs text-amber-700 font-bold mb-1">
        🍱 Menú de hoy · {new Date(menu.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
      </p>
      <p className="text-sm text-amber-900 font-medium">{menu.items.map((it) => it.label).join(" · ")}</p>
    </div>
  );
}
