import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { auditService } from "../services/usersService";
import type { AuditLogEntry } from "../types/users";

const ACTION_COLORS: Record<AuditLogEntry["action"], string> = {
  CREATE: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-rose-50 text-rose-700",
};

function summarizeChange(entry: AuditLogEntry): string {
  if (!entry.oldValue && !entry.newValue) return "—";
  try {
    const before = entry.oldValue ? JSON.parse(entry.oldValue) : null;
    const after = entry.newValue ? JSON.parse(entry.newValue) : null;
    if (before && after) {
      const changedKeys = Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
      if (changedKeys.length === 0) return "Sin cambios detectados";
      return changedKeys.map((k) => `${k}: ${before[k]} → ${after[k]}`).join(", ");
    }
    return JSON.stringify(after ?? before);
  } catch {
    return "—";
  }
}

// Section 34 — Auditoría: usuario, fecha/hora, acción, módulo, valor anterior/nuevo.
export function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState("");

  function load() {
    auditService.list(moduleFilter || undefined).then(setLogs);
  }
  useEffect(load, [moduleFilter]);

  const modules = Array.from(new Set(logs.map((l) => l.module)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Auditoría</h2>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="">Todos los módulos</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Usuario</th>
                <th className="py-2 pr-4 font-medium">Acción</th>
                <th className="py-2 pr-4 font-medium">Módulo</th>
                <th className="py-2 pr-4 font-medium">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("es-MX")}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{l.user?.name ?? "Sistema"}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[l.action]}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{l.module}</td>
                  <td className="py-2 pr-4 text-slate-500 max-w-xs truncate" title={summarizeChange(l)}>
                    {summarizeChange(l)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-6">
                    Sin registros de auditoría todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
