"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
// Role guard
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user; // populated from auth middleware
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Permission guard
const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.permissions.includes(permission)) {
            return res.status(403).json({ error: "Permission denied" });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=role.js.map