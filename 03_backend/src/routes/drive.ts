import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadFile, createBackup } from "../services/drive.js";
import { logAudit } from "../utils/audit.js";

const router = Router();

// Section 35 — status visible siempre, para que el panel nunca confunda MOCK con real.
router.get(
  "/status",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({
      mode: env.GOOGLE_DRIVE_MODE,
      folderConfigured: Boolean(env.GOOGLE_DRIVE_FOLDER_ID) || env.GOOGLE_DRIVE_MODE === "MOCK",
    });
  })
);

router.post(
  "/upload",
  requireAuth,
  requireRole("ADMINISTRADOR", "OPERADOR"),
  validateBody(z.object({ filename: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const result = await uploadFile(req.body.filename);
    res.status(201).json(result);
  })
);

router.post(
  "/backup",
  requireAuth,
  requireRole("ADMINISTRADOR"),
  asyncHandler(async (req, res) => {
    const result = await createBackup();
    await logAudit({ userId: req.user?.id, action: "CREATE", module: "Backup", newValue: result });
    res.status(201).json(result);
  })
);

export default router;
