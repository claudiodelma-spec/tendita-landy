import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { permissionsForRoles } from "../services/permissionCatalog.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.active) throw new ApiError(401, "Credenciales inválidas");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Credenciales inválidas");

    const roles = user.roles.map((r: { role: { name: string } }) => r.role.name);
    const permissions = permissionsForRoles(roles);
    const token = jwt.sign({ id: user.id, email: user.email, roles }, env.JWT_SECRET, {
      // jsonwebtoken's types want a numeric or ms-style literal; our env value
      // is a validated free-form string (e.g. "8h"), so it's cast here.
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, roles, permissions } });
  })
);

// Section 6: lets the frontend know which nav sections/actions to show
// for the signed-in user without re-deriving role→permission logic client-side.
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "No autenticado");
    const permissions = permissionsForRoles(req.user.roles);
    res.json({ id: req.user.id, email: req.user.email, roles: req.user.roles, permissions });
  })
);

export default router;

