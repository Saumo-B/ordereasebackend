import { Request, Response, NextFunction } from "express";
import { IUser , UserRole } from "../models/User";

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
