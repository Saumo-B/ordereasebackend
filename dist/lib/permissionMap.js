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
    // Tags routes
    // ----------------------
    "POST /api/tags": permission_1.PERMISSIONS.TAG_MANAGE,
    "PATCH /api/tags/:id": permission_1.PERMISSIONS.TAG_MANAGE,
    "DELETE /api/tags/:id": permission_1.PERMISSIONS.TAG_MANAGE,
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
    "POST   /api/table": permission_1.PERMISSIONS.TABLE_CREATE,
    "GET    /api/table": permission_1.PERMISSIONS.TABLE_VIEW,
    "GET    /api/table/:id": permission_1.PERMISSIONS.TABLE_VIEW,
    "PATCH  /api/table/:id": permission_1.PERMISSIONS.TABLE_UPDATE,
    "DELETE /api/table/:id": permission_1.PERMISSIONS.TABLE_DELETE,
    // ----------------------
    // Branch routes
    // ----------------------
    "POST   /api/branch": permission_1.PERMISSIONS.BRANCH_CREATE,
    "GET    /api/branch": permission_1.PERMISSIONS.BRANCH_VIEW,
    "PUT    /api/branch/:id": permission_1.PERMISSIONS.BRANCH_UPDATE,
    "DELETE /api/branch/:id": permission_1.PERMISSIONS.BRANCH_DELETE,
    // ----------------------
    // Dashboard & Reports
    // ----------------------
    "GET /api/kitchen/dashboard-stats": permission_1.PERMISSIONS.DASHBOARD_VIEW,
    "GET /api/kitchen/sales-report": permission_1.PERMISSIONS.SALESREPORT_VIEW,
    // ----------------------
    // Staff management
    // ----------------------
    "POST   /api/register": permission_1.PERMISSIONS.STAFF_MANAGE,
    "PATCH  /api/assign/:id": permission_1.PERMISSIONS.STAFF_MANAGE,
    "DELETE /api/user/:id": permission_1.PERMISSIONS.STAFF_MANAGE,
    "POST   /api/login/": permission_1.PERMISSIONS.ORDER_VIEW,
};
//# sourceMappingURL=permissionMap.js.map