"use strict";
//src/middleware/role.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
exports.autoPermission = autoPermission;
const permissionMap_1 = require("../lib/permissionMap");
function normalizePath(path) {
    // Replace Mongo ObjectId patterns with :id
    return path.replace(/\/[a-f0-9]{24}/gi, "/:id");
}
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
    console.log("=== Permission middleware called ===");
    console.log("Request path:", req.path);
    console.log("Request method:", req.method);
    const user = req.user;
    console.log("User attached to request:", user ? user.email : "undefined");
    console.log("User role:", user === null || user === void 0 ? void 0 : user.role);
    console.log("User permissions:", user === null || user === void 0 ? void 0 : user.permissions);
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
    const required = permissionMap_1.permissionMap[routeKey];
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
        console.log(`User permissions [${user.permissions}] do NOT include required [${required}] → Forbidden`);
        return res.status(403).json({ error: "Permission denied" });
    }
    console.log("User has required permission → allow");
    next();
}
//# sourceMappingURL=role.js.map