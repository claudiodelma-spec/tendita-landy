import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

const router = crudRouter({
  model: prisma.savings,
  moduleName: "Savings",
  createSchema: z.object({
    label: z.string().min(1),
    amount: z.number(),
    date: z.coerce.date(),
    type: z.enum(["INICIAL", "DIARIO", "SEMANAL", "MENSUAL", "EXTRAORDINARIO"]),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

export default router;
