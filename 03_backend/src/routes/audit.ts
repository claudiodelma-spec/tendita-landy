import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    const { module } = req.query;
    const logs = await prisma.auditLog.findMany({
      where: { module: module ? String(module) : undefined },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(logs);
  })
);

export default router;
