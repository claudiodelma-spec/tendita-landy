import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

const router = crudRouter({
  model: prisma.income,
  moduleName: "Income",
  createSchema: z.object({
    amount: z.number().positive(),
    date: z.coerce.date(),
    source: z.string().optional(),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

export default router;
