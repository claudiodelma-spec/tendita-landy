import { prisma } from "../config/prisma.js";

interface AuditParams {
  userId?: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  module: string;
  recordId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

// BN-008: every change to a configurable financial value is logged.
export async function logAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      module: params.module,
      recordId: params.recordId,
      oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue) : undefined,
      newValue: params.newValue !== undefined ? JSON.stringify(params.newValue) : undefined,
    },
  });
}
