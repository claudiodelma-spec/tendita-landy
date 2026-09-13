import { prisma } from "../config/prisma.js";

/**
 * Reads a configurable value from the Setting table (section 2: "NINGÚN
 * valor financiero/operativo debe quedar fijo en el código"). Falls back to
 * the given default (typically the .env value) only if the setting hasn't
 * been created/seeded yet — this keeps the app booting on a fresh DB while
 * still letting Configuración → WhatsApp override it at runtime.
 */
export async function getSettingValue(key: string, fallback: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
}
