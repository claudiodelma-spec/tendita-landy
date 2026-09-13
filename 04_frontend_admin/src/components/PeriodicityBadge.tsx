import React from "react";
import type { Periodicity } from "../types/finance";

const labels: Record<Periodicity, string> = {
  DIARIO: "Diario",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  ANUAL: "Anual",
  PERSONALIZADO: "Personalizado",
  EXTRAORDINARIO: "Extraordinario",
};

export function PeriodicityBadge({ value }: { value: Periodicity }) {
  return (
    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
      {labels[value] ?? value}
    </span>
  );
}
