import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  roleNames: z.array(z.enum(["ADMINISTRADOR", "GESTION", "OPERADOR", "PADRE"])).min(1),
});

router.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { roles: { include: { role: true } } },
    });
    res.json(
      users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        active: u.active,
        roles: u.roles.map((r: any) => r.role.name),
      }))
    );
  })
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, roleNames } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "Ya existe un usuario con ese email");

    const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roles: { create: roles.map((r: any) => ({ roleId: r.id })) },
      },
    });

    await logAudit({ userId: req.user?.id, action: "CREATE", module: "User", recordId: user.id });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  })
);

router.put(
  "/:id/active",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  validateBody(z.object({ active: z.boolean() })),
  asyncHandler(async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) throw new ApiError(404, "Usuario no encontrado");
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: req.body.active },
    });
    await logAudit({
      userId: req.user?.id,
      action: "UPDATE",
      module: "User",
      recordId: updated.id,
      oldValue: { active: before.active },
      newValue: { active: updated.active },
    });
    res.json({ id: updated.id, active: updated.active });
  })
);

export default router;
