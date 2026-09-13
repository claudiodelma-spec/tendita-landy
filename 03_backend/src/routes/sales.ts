import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

// Sales are generated from confirmed Orders (see orders.ts) — this route is read-only.
const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMINISTRADOR", "GESTION"),
  asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: from ? new Date(String(from)) : undefined,
          lte: to ? new Date(String(to)) : undefined,
        },
      },
      include: { items: { include: { product: true } } },
      orderBy: { date: "desc" },
    });
    res.json(sales);
  })
);

export default router;
