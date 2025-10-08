// src/lib/permissionMap.ts
import { PERMISSIONS } from "./permission";

export const permissionMap: Record<string, string> = {
  // ----------------------
  // Menu routes
  // ----------------------
  "POST /api/menu"      : PERMISSIONS.MENU_CREATE,
  "GET /api/menu"       : PERMISSIONS.MENU_VIEW,
  "GET /api/menu/:id"   : PERMISSIONS.MENU_VIEW,
  "PATCH /api/menu/:id" : PERMISSIONS.MENU_UPDATE,
  "DELETE /api/menu/:id": PERMISSIONS.MENU_DELETE,
  // ----------------------
  // Tags routes
  // ----------------------
  "POST /api/tags"      : PERMISSIONS.TAG_MANAGE,
  "PATCH /api/tags/:id" : PERMISSIONS.TAG_MANAGE,
  "DELETE /api/tags/:id": PERMISSIONS.TAG_MANAGE,

  // ----------------------
  // Ingredient routes
  // ----------------------
  "POST /api/ingredients"      : PERMISSIONS.INGRDIENT_CREATE,
  "GET /api/ingredients"       : PERMISSIONS.INGREDIENT_VIEW,
  "GET /api/ingredients/:id"   : PERMISSIONS.INGREDIENT_VIEW,
  "PATCH /api/ingredients/:id" : PERMISSIONS.INGREDIENT_UPDATE,
  "DELETE /api/ingredients/:id": PERMISSIONS.INGREDIENT_DELETE,

  // ----------------------
  // Order routes
  // ----------------------
  "POST /api/orders"      : PERMISSIONS.ORDER_CREATE,
  "GET /api/orders"       : PERMISSIONS.ORDER_VIEW,
  "GET /api/orders/:id"   : PERMISSIONS.ORDER_VIEW,
  "PATCH /api/orders/:id" : PERMISSIONS.ORDER_UPDATE,
  "DELETE /api/orders/:id": PERMISSIONS.ORDER_DELETE,

  // ----------------------
  // Table routes
  // ----------------------
  "POST   /api/table"     : PERMISSIONS.TABLE_CREATE,
  "GET    /api/table"     : PERMISSIONS.TABLE_VIEW,
  "GET    /api/table/:id" : PERMISSIONS.TABLE_VIEW,
  "PATCH  /api/table/:id" : PERMISSIONS.TABLE_UPDATE,
  "DELETE /api/table/:id" : PERMISSIONS.TABLE_DELETE,

  // ----------------------
  // Branch routes
  // ----------------------
  "POST   /api/branch"    : PERMISSIONS.BRANCH_CREATE,
  "GET    /api/branch"    : PERMISSIONS.BRANCH_VIEW,
  "PUT    /api/branch/:id": PERMISSIONS.BRANCH_UPDATE,
  "DELETE /api/branch/:id": PERMISSIONS.BRANCH_DELETE,

  // ----------------------
  // Dashboard & Reports
  // ----------------------
  "GET /api/kitchen/dashboard-stats": PERMISSIONS.DASHBOARD_VIEW,
  "GET /api/kitchen/sales-report"   : PERMISSIONS.SALESREPORT_VIEW,
  
  // ----------------------
  // Staff management
  // ----------------------
  "POST   /api/register"  : PERMISSIONS.STAFF_MANAGE,
  "PATCH  /api/assign/:id": PERMISSIONS.STAFF_MANAGE,
  "DELETE /api/user/:id"  : PERMISSIONS.STAFF_MANAGE,
  "POST   /api/login/"    : PERMISSIONS.ORDER_VIEW,
};
