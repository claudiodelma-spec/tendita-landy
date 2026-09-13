import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./errorHandler.js";
import { permissionsForRoles } from "../services/permissionCatalog.js";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Token no proporcionado");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, "Token inválido o expirado");
  }
}

export function requireRole(...allowed: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "No autenticado");
    const hasRole = req.user.roles.some((r) => allowed.includes(r));
    if (!hasRole) throw new ApiError(403, "No tienes permisos para esta acción");
    next();
  };
}

// Fine-grained alternative to requireRole for routes that should check a
// specific permission key rather than a hardcoded role list (see
// services/permissions.ts). Not yet used everywhere — Fase 2 introduces the
// catalog; migrating each route from requireRole to requirePermission can
// happen incrementally without breaking the API contract.
export function requirePermission(...keys: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "No autenticado");
    const granted = new Set(permissionsForRoles(req.user.roles));
    const hasAll = keys.every((k) => granted.has(k));
    if (!hasAll) throw new ApiError(403, "No tienes permisos para esta acción");
    next();
  };
}
