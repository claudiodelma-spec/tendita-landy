import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

const periodicity = z.enum(["DIARIO", "SEMANAL", "MENSUAL", "ANUAL", "PERSONALIZADO", "EXTRAORDINARIO"]);

// BN-001: rent history is preserved — updates never overwrite past values,
// new periods should be created instead of mutating old ones in the UI layer.
const router = crudRouter({
  model: prisma.rent,
  moduleName: "Rent",
  createSchema: z.object({
    concept: z.string().optional(),
    value: z.number().positive(),
    periodicity,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

export default router;
