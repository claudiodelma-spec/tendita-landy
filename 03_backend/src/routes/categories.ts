import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

// Product categories (store side) — not to be confused with ExpenseCategory.
const router = crudRouter({
  model: prisma.category,
  moduleName: "Category",
  createSchema: z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    active: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
  writeRoles: ["ADMINISTRADOR", "OPERADOR"],
});

export default router;
