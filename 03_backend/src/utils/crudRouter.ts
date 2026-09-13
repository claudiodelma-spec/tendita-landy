import { Router } from "express";
import { z, ZodObject } from "zod";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { logAudit } from "./audit.js";

type Delegate = {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

interface CrudOptions {
  model: Delegate;
  moduleName: string; // used in audit log + errors
  createSchema: ZodObject<any>;
  updateSchema?: ZodObject<any>;
  readRoles?: string[]; // roles allowed to GET (default: any authenticated user)
  writeRoles: string[]; // roles allowed to POST/PUT/DELETE
  auditWrites?: boolean; // set true for financial resources (BN-008)
}

/**
 * Generic CRUD router factory: GET /, GET /:id, POST /, PUT /:id, DELETE /:id.
 * Keeps every resource route consistent and reduces duplication across
 * the many endpoints required by section 44 of the spec.
 */
export function crudRouter(opts: CrudOptions) {
  const router = Router();
  const updateSchema = opts.updateSchema ?? opts.createSchema.partial();
  // requireRole(...[]) would reject everyone, so only apply a read guard
  // when readRoles was actually configured for this resource.
  const readGuard = opts.readRoles && opts.readRoles.length > 0 ? [requireRole(...opts.readRoles)] : [];

  router.get(
    "/",
    requireAuth,
    ...readGuard,
    asyncHandler(async (_req, res) => {
      const records = await opts.model.findMany();
      res.json(records);
    })
  );

  router.get(
    "/:id",
    requireAuth,
    ...readGuard,
    asyncHandler(async (req, res) => {
      const record = await opts.model.findUnique({ where: { id: req.params.id } });
      if (!record) return res.status(404).json({ error: `${opts.moduleName} no encontrado` });
      res.json(record);
    })
  );

  router.post(
    "/",
    requireAuth,
    requireRole(...opts.writeRoles),
    validateBody(opts.createSchema),
    asyncHandler(async (req, res) => {
      const created = await opts.model.create({ data: req.body });
      if (opts.auditWrites) {
        await logAudit({
          userId: req.user?.id,
          action: "CREATE",
          module: opts.moduleName,
          recordId: created.id,
          newValue: req.body,
        });
      }
      res.status(201).json(created);
    })
  );

  router.put(
    "/:id",
    requireAuth,
    requireRole(...opts.writeRoles),
    validateBody(updateSchema),
    asyncHandler(async (req, res) => {
      const before = await opts.model.findUnique({ where: { id: req.params.id } });
      if (!before) return res.status(404).json({ error: `${opts.moduleName} no encontrado` });
      const updated = await opts.model.update({ where: { id: req.params.id }, data: req.body });
      if (opts.auditWrites) {
        await logAudit({
          userId: req.user?.id,
          action: "UPDATE",
          module: opts.moduleName,
          recordId: updated.id,
          oldValue: before,
          newValue: req.body,
        });
      }
      res.json(updated);
    })
  );

  router.delete(
    "/:id",
    requireAuth,
    requireRole(...opts.writeRoles),
    asyncHandler(async (req, res) => {
      const before = await opts.model.findUnique({ where: { id: req.params.id } });
      if (!before) return res.status(404).json({ error: `${opts.moduleName} no encontrado` });
      await opts.model.delete({ where: { id: req.params.id } });
      if (opts.auditWrites) {
        await logAudit({
          userId: req.user?.id,
          action: "DELETE",
          module: opts.moduleName,
          recordId: req.params.id,
          oldValue: before,
        });
      }
      res.status(204).send();
    })
  );

  return router;
}

export { z };
