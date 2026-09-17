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

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  validateBody(
    z.object({
      name: z.string().min(1).optional(),
      roleNames: z.array(z.enum(["ADMINISTRADOR", "GESTION", "OPERADOR", "PADRE"])).min(1).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) throw new ApiError(404, "Usuario no encontrado");

    if (req.body.name) {
      await prisma.user.update({ where: { id: req.params.id }, data: { name: req.body.name } });
    }
    if (req.body.roleNames) {
      const roles = await prisma.role.findMany({ where: { name: { in: req.body.roleNames } } });
      await prisma.userRole.deleteMany({ where: { userId: req.params.id } });
      await prisma.userRole.createMany({
        data: roles.map((r: any) => ({ userId: req.params.id, roleId: r.id })),
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { roles: { include: { role: true } } },
    });

    await logAudit({ userId: req.user?.id, action: "UPDATE", module: "User", recordId: req.params.id });
    res.json({
      id: updated!.id,
      name: updated!.name,
      email: updated!.email,
      active: updated!.active,
      roles: updated!.roles.map((r: any) => r.role.name),
    });
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) throw new ApiError(404, "Usuario no encontrado");
    if (req.user?.id === req.params.id) {
      throw new ApiError(400, "No puedes eliminar tu propio usuario mientras tienes la sesión iniciada");
    }
    try {
      await prisma.userRole.deleteMany({ where: { userId: req.params.id } });
      await prisma.user.delete({ where: { id: req.params.id } });
    } catch {
      throw new ApiError(
        409,
        "Este usuario tiene pedidos, auditoría u otros registros asociados — desactívalo en vez de eliminarlo"
      );
    }
    await logAudit({ userId: req.user?.id, action: "DELETE", module: "User", recordId: req.params.id, oldValue: before });
    res.status(204).send();
  })
);

export default router;
