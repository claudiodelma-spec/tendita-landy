import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

const router = crudRouter({
  model: prisma.schoolCalendar,
  moduleName: "SchoolCalendar",
  createSchema: z.object({
    label: z.string().min(1),
    date: z.coerce.date(),
    type: z.enum(["CLASS_START", "CLASS_END", "HOLIDAY", "NO_CLASS", "SPECIAL"]),
    notes: z.string().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
});

export default router;
