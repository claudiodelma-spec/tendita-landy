import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";

// REGLA ABSOLUTA: nunca agregar campos de stock/inventario aquí.
const router = crudRouter({
  model: prisma.product,
  moduleName: "Product",
  createSchema: z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive(),
    categoryId: z.string(),
    status: z.enum(["ACTIVO", "INACTIVO"]).optional(),
    schedule: z.string().optional(),
    order: z.number().int().optional(),
  }),
  writeRoles: ["ADMINISTRADOR", "OPERADOR"],
});

export default router;
