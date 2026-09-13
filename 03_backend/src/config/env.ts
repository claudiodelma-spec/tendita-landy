import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  ENVIRONMENT: required("ENVIRONMENT", "SANDBOX"),
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: required("DATABASE_URL", "file:./dev.db"),
  JWT_SECRET: required("JWT_SECRET", "CHANGE_ME_SANDBOX_ONLY"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "8h",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER ?? "+52_1_00_0000_0000_TEST",
  WHATSAPP_MODE: process.env.WHATSAPP_MODE ?? "SANDBOX",
  GOOGLE_DRIVE_MODE: process.env.GOOGLE_DRIVE_MODE ?? "MOCK",
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID ?? "",
};

export const isSandbox = env.ENVIRONMENT === "SANDBOX";
