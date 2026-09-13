import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

const router = crudRouter({
  model: prisma.employee,
  moduleName: "Employee",
  createSchema: z.object({
    name: z.string().min(1),
    dailySalary: z.number().positive(),
    active: z.boolean().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

export default router;
