//src/middleware/role.ts

import { Request, Response, NextFunction } from "express";
import { IUser , UserRole } from "../models/User";
import { permissionMap } from "../lib/permissionMap";


function normalizePath(path: string) {
  // Replace Mongo ObjectId patterns with :id
  return path.replace(/\/[a-f0-9]{24}/gi, "/:id");
}

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
  console.log("=== Permission middleware called ===");
  console.log("Request path:", req.path);
  console.log("Request method:", req.method);

  const user = req.user as IUser | undefined;
  console.log("User attached to request:", user ? user.email : "undefined");
  console.log("User role:", user?.role);
  console.log("User permissions:", user?.permissions);

  if (!user) {
    console.log("No user found on request → Unauthorized");
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Owner / dev bypass (optional)
  // if (user.role === "dev") {
  //   console.log("User is dev → bypass permission check");
  //   return next();
  // }

  // Normalize route key
  const routeKey = `${req.method.toUpperCase()} ${normalizePath(req.baseUrl + req.path)}`;
  console.log("Computed route key:", routeKey);

  const required = permissionMap[routeKey];
  console.log("Required permission for this route:", required || "none");

  if (!required) {
    console.log("No explicit permission required → allow");
    return next();
  }

  // Manager shortcut
  if (user.role === "manager" && required === "staff:manage") {
    console.log("Manager shortcut → allow");
    return next();
  }

  if (!user.permissions.includes(required)) {
    console.log(
      `User permissions [${user.permissions}] do NOT include required [${required}] → Forbidden`
    );
    return res.status(403).json({ error: "Permission denied" });
  }

  console.log("User has required permission → allow");
  next();
}
