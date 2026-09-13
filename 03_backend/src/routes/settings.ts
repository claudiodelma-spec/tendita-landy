import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

// Settings has no numeric id-based create semantics beyond key/value —
// reuse crudRouter for list/get/update/delete, custom upsert-by-key below.
const router = crudRouter({
  model: prisma.setting,
  moduleName: "Setting",
  createSchema: z.object({
    key: z.string().min(1),
    value: z.string(),
    category: z.enum(["BUSINESS", "FINANCE", "STORE", "CAROUSEL", "SYSTEM"]),
  }),
  readRoles: ["ADMINISTRADOR"],
  writeRoles: ["ADMINISTRADOR"],
  auditWrites: true,
});

export default router;
