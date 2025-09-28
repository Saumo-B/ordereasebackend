"use strict";
//src/middleware/role.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
exports.autoPermission = autoPermission;
const permissionMap_1 = require("../lib/permissionMap");
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
function autoPermission(req, res, next) {
    var _a;
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: "Unauthorized" });
    // Owner bypass
    if (user.role === "owner")
        return next();
    // Normalize route key (method + path)
    const key = `${req.method.toUpperCase()} ${(_a = req.route) === null || _a === void 0 ? void 0 : _a.path}`;
    const required = permissionMap_1.permissionMap[key];
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
//# sourceMappingURL=role.js.map