"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionMap = void 0;
// src/lib/permissionMap.ts
const permission_1 = require("./permission");
exports.permissionMap = {
    // ----------------------
    // Menu routes
    // ----------------------
    "POST /api/menu": permission_1.PERMISSIONS.MENU_CREATE,
    "GET /api/menu": permission_1.PERMISSIONS.MENU_VIEW,
    "GET /api/menu/:id": permission_1.PERMISSIONS.MENU_VIEW,
    "PATCH /api/menu/:id": permission_1.PERMISSIONS.MENU_UPDATE,
    "DELETE /api/menu/:id": permission_1.PERMISSIONS.MENU_DELETE,
    // ----------------------
    // Ingredient routes
    // ----------------------
    "POST /api/ingredients": permission_1.PERMISSIONS.INGRDIENT_CREATE,
    "GET /api/ingredients": permission_1.PERMISSIONS.INGREDIENT_VIEW,
    "GET /api/ingredients/:id": permission_1.PERMISSIONS.INGREDIENT_VIEW,
    "PATCH /api/ingredients/:id": permission_1.PERMISSIONS.INGREDIENT_UPDATE,
    "DELETE /api/ingredients/:id": permission_1.PERMISSIONS.INGREDIENT_DELETE,
    // ----------------------
    // Order routes
    // ----------------------
    "POST /api/orders": permission_1.PERMISSIONS.ORDER_CREATE,
    "GET /api/orders": permission_1.PERMISSIONS.ORDER_VIEW,
    "GET /api/orders/:id": permission_1.PERMISSIONS.ORDER_VIEW,
    "PATCH /api/orders/:id": permission_1.PERMISSIONS.ORDER_UPDATE,
    "DELETE /api/orders/:id": permission_1.PERMISSIONS.ORDER_DELETE,
    // ----------------------
    // Table routes
    // ----------------------
    "POST /api/table": permission_1.PERMISSIONS.TABLE_CREATE,
    "GET /api/table": permission_1.PERMISSIONS.TABLE_VIEW,
    "GET /api/table/:id": permission_1.PERMISSIONS.TABLE_VIEW,
    "PATCH /api/table/:id": permission_1.PERMISSIONS.TABLE_UPDATE,
    "DELETE /api/table/:id": permission_1.PERMISSIONS.TABLE_DELETE,
    // ----------------------
    // Dashboard & Reports
    // ----------------------
    "GET /api/dashboard-stats": permission_1.PERMISSIONS.DASHBOARD_VIEW,
    "GET /api/sales-report": permission_1.PERMISSIONS.SALESREPORT_VIEW,
    // ----------------------
    // Staff management
    // ----------------------
    "POST /api/register": permission_1.PERMISSIONS.STAFF_MANAGE,
    "PATCH /api/assign/:id": permission_1.PERMISSIONS.STAFF_MANAGE,
    "DELETE /api/:id": permission_1.PERMISSIONS.STAFF_MANAGE,
};
//# sourceMappingURL=permissionMap.js.map