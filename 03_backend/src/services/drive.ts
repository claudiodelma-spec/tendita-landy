import { promises as fs } from "fs";
import path from "path";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

// Section 35 — Google Drive: usado para imágenes/carrusel/reportes/backups,
// NUNCA como base de datos. Mientras la integración real no esté lista, todo
// pasa por un modo MOCK explícito y visible (nunca silencioso).
const BACKUP_DIR = path.resolve(process.cwd(), "storage", "backups");

export interface DriveUploadResult {
  driveUrl: string;
  mode: "MOCK" | "REAL";
}

export async function uploadFile(filename: string): Promise<DriveUploadResult> {
  if (env.GOOGLE_DRIVE_MODE !== "MOCK") {
    // Section 35: "La conexión real se hará posteriormente." Real Google
    // Drive API calls (OAuth, resumable upload) are intentionally not
    // implemented yet — flagging clearly instead of silently mocking once
    // someone flips GOOGLE_DRIVE_MODE to REAL without wiring credentials.
    throw new Error(
      "GOOGLE_DRIVE_MODE=REAL pero la integración real con Google Drive aún no está implementada. " +
        "Configura GOOGLE_DRIVE_CLIENT_ID/SECRET y completa el flujo OAuth antes de usar este modo."
    );
  }
  const fakeId = Math.random().toString(36).slice(2, 10);
  return {
    driveUrl: `https://drive.mock.local/tendita-landy/${fakeId}/${encodeURIComponent(filename)}`,
    mode: "MOCK",
  };
}

export interface BackupResult {
  path: string;
  mode: "MOCK" | "REAL";
  timestamp: string;
  tables: string[];
}

/**
 * Section 37 — Backups: "En SANDBOX: Backup local." Dumps the
 * configuration-critical tables (never the full DB — this is a lightweight
 * snapshot, not a restore mechanism) to a local JSON file. In REAL/production
 * mode this would additionally push the file to Google Drive; that upload
 * step is not implemented yet (see uploadFile above).
 */
export async function createBackup(): Promise<BackupResult> {
  const [settings, rents, employees, goals, vacationPeriods] = await Promise.all([
    prisma.setting.findMany(),
    prisma.rent.findMany(),
    prisma.employee.findMany(),
    prisma.goal.findMany(),
    prisma.vacationPeriod.findMany(),
  ]);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    settings,
    rents,
    employees,
    goals,
    vacationPeriods,
  };

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const filename = `backup-${Date.now()}.json`;
  const filePath = path.join(BACKUP_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");

  let driveNote = "";
  if (env.GOOGLE_DRIVE_MODE === "MOCK") {
    driveNote = " (no se subió a Drive real — modo MOCK)";
  }

  return {
    path: filePath + driveNote,
    mode: env.GOOGLE_DRIVE_MODE === "MOCK" ? "MOCK" : "REAL",
    timestamp: snapshot.generatedAt,
    tables: ["settings", "rents", "employees", "goals", "vacationPeriods"],
  };
}
