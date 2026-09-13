import { Router } from "express";
import { crudRouter, z } from "../utils/crudRouter.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { logAudit } from "../utils/audit.js";
import { ApiError } from "../middleware/errorHandler.js";

const periodicity = z.enum([
  "DIARIO",
  "SEMANAL",
  "MENSUAL",
  "ANUAL",
  "PERSONALIZADO",
  "EXTRAORDINARIO",
]);

const router = crudRouter({
  model: prisma.expense,
  moduleName: "Expense",
  createSchema: z.object({
    concept: z.string().min(1),
    categoryId: z.string(),
    amount: z.number().positive(),
    date: z.coerce.date(),
    periodicity,
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),
  readRoles: ["ADMINISTRADOR", "GESTION"],
  writeRoles: ["ADMINISTRADOR", "GESTION"],
  auditWrites: true,
});

// Expense categories are mounted separately (see routes/index.ts) at
// /api/expenses/categories BEFORE the /:id routes below, to avoid Express
// matching "categories" against the generic "/:id" pattern.
export const expenseCategoriesRouter = Router();
expenseCategoriesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await prisma.expenseCategory.findMany());
  })
);
expenseCategoriesRouter.post(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  validateBody(z.object({ name: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const category = await prisma.expenseCategory.create({ data: req.body });
    await logAudit({ userId: req.user?.id, action: "CREATE", module: "ExpenseCategory", recordId: category.id });
    res.status(201).json(category);
  })
);
expenseCategoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const before = await prisma.expenseCategory.findUnique({ where: { id: req.params.id } });
    if (!before) throw new ApiError(404, "Categoría no encontrada");
    await prisma.expenseCategory.delete({ where: { id: req.params.id } });
    await logAudit({ userId: req.user?.id, action: "DELETE", module: "ExpenseCategory", recordId: req.params.id, oldValue: before });
    res.status(204).send();
  })
);

export default router;
