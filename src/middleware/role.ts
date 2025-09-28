//src/middleware/role.ts

import { Request, Response, NextFunction } from "express";
import { IUser , UserRole } from "../models/User";
import { permissionMap } from "../lib/permissionMap";

// Role guard
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser; // populated from auth middleware
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

// Permission guard
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;
    if (!user || !user.permissions.includes(permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    next();
  };
};

export function autoPermission(req: Request, res: Response, next: NextFunction) {
  const user = req.user as IUser | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Owner bypass
  if (user.role === "owner") return next();

  // Normalize route key (method + path)
  const key = `${req.method.toUpperCase()} ${req.route?.path}`;

  const required = permissionMap[key];
  if (!required) {
    // route has no explicit restriction
    return next();
  }

  // Manager shortcut
  if (user.role === "manager" && required === "staff:manage") {
    return next();
  }

  if (!user.permissions.includes(required)) {
    return res.status(403).json({ error: "Permission denied" });
  }

  next();
}
