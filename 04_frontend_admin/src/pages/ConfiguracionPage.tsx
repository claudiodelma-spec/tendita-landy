import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { settingsService } from "../services/settingsService";
import { driveService } from "../services/driveService";
import type { Setting, SettingCategory } from "../types/settings";

const CATEGORY_LABELS: Record<SettingCategory, string> = {
  BUSINESS: "Datos del negocio",
  FINANCE: "Finanzas",
  STORE: "Tienda",
  CAROUSEL: "Carrusel",
  SYSTEM: "Sistema",
};

const KEY_LABELS: Record<string, string> = {
  "business.name": "Nombre del negocio",
  "business.logo": "Logo (URL)",
  "whatsapp.number": "Número de WhatsApp (formato: 521XXXXXXXXXX)",
  "finance.currency": "Moneda",
  "system.timezone": "Zona horaria",
  "system.environment": "Entorno",
  "carousel.maxImages": "Máximo de imágenes activas",
};

// Section 33 — Configuración: todo valor editable desde aquí, nunca fijo en el código.
export function ConfiguracionPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [driveMode, setDriveMode] = useState<"MOCK" | "REAL" | null>(null);
  const [backupResult, setBackupResult] = useState<{ path: string; timestamp: string } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  function load() {
    settingsService.list().then((list) => {
      setSettings(list);
      setDrafts(Object.fromEntries(list.map((s) => [s.id, s.value])));
    });
    driveService.getStatus().then((s) => setDriveMode(s.mode));
  }
  useEffect(load, []);

  async function runBackup() {
    setBackingUp(true);
    setBackupError(null);
    try {
      const result = await driveService.createBackup();
      setBackupResult({ path: result.path, timestamp: result.timestamp });
    } catch (err: any) {
      setBackupError(err.message ?? "No se pudo generar el backup");
    } finally {
      setBackingUp(false);
    }
  }

  async function save(setting: Setting) {
    await settingsService.update(setting.id, drafts[setting.id]);
    setSavedKey(setting.id);
    setTimeout(() => setSavedKey((k) => (k === setting.id ? null : k)), 1500);
    load();
  }

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const isReadOnlyEnvironment = (key: string) => key === "system.environment";

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Configuración</h2>

      {(Object.keys(CATEGORY_LABELS) as SettingCategory[]).map((cat) => {
        const items = grouped[cat] ?? [];
        if (items.length === 0) return null;
        return (
          <Card key={cat}>
            <p className="text-sm font-medium text-slate-700 mb-3">{CATEGORY_LABELS[cat]}</p>
            <div className="space-y-3">
              {items.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <label className="text-xs text-slate-500 w-64 shrink-0">{KEY_LABELS[s.key] ?? s.key}</label>
                  <input
                    disabled={isReadOnlyEnvironment(s.key)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                    value={drafts[s.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [s.id]: e.target.value })}
                  />
                  {!isReadOnlyEnvironment(s.key) && (
                    <button
                      onClick={() => save(s)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 shrink-0"
                    >
                      {savedKey === s.id ? "✓ Guardado" : "Guardar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <p className="text-xs text-slate-400">
        El modo SANDBOX/PRODUCTION de WhatsApp y Google Drive se controla solo desde variables de entorno del
        servidor (por seguridad) — no aparece aquí.
      </p>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-3">Google Drive y Backups (sección 35/37)</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500">Modo actual:</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              driveMode === "MOCK" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {driveMode ?? "…"}
          </span>
          {driveMode === "MOCK" && (
            <span className="text-xs text-slate-400">
              — las imágenes/backups no se suben a Drive real todavía
            </span>
          )}
        </div>
        <button
          onClick={runBackup}
          disabled={backingUp}
          className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {backingUp ? "Generando backup…" : "Generar backup local ahora"}
        </button>
        {backupResult && (
          <p className="text-xs text-emerald-600 mt-2">
            ✓ Backup generado el {new Date(backupResult.timestamp).toLocaleString("es-MX")} — guardado en el
            servidor ({backupResult.path.includes("MOCK") ? "modo mock, no subido a Drive real" : "subido a Drive"}
            ).
          </p>
        )}
        {backupError && <p className="text-xs text-rose-600 mt-2">{backupError}</p>}
      </Card>
    </div>
  );
}
