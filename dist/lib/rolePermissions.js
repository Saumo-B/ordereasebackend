"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_DEFAULT_PERMISSIONS = void 0;
const permission_1 = require("./permission");
exports.ROLE_DEFAULT_PERMISSIONS = {
    owner: Object.values(permission_1.PERMISSIONS), // all permissions
    manager: [
        permission_1.PERMISSIONS.MENU_VIEW,
        permission_1.PERMISSIONS.MENU_CREATE,
        permission_1.PERMISSIONS.MENU_UPDATE,
        permission_1.PERMISSIONS.ORDER_VIEW,
        permission_1.PERMISSIONS.ORDER_UPDATE,
        permission_1.PERMISSIONS.STAFF_MANAGE,
        permission_1.PERMISSIONS.DASHBOARD_VIEW,
        permission_1.PERMISSIONS.INGREDIENT_VIEW,
        permission_1.PERMISSIONS.INGRDIENT_CREATE,
        permission_1.PERMISSIONS.INGREDIENT_UPDATE,
        permission_1.PERMISSIONS.INGREDIENT_DELETE
    ],
    chef: [
        permission_1.PERMISSIONS.ORDER_VIEW,
        permission_1.PERMISSIONS.ORDER_UPDATE,
        permission_1.PERMISSIONS.INGREDIENT_VIEW,
        permission_1.PERMISSIONS.MENU_UPDATE,
        permission_1.PERMISSIONS.MENU_VIEW
    ],
    waiter: [
        permission_1.PERMISSIONS.ORDER_VIEW,
        permission_1.PERMISSIONS.ORDER_CREATE,
        permission_1.PERMISSIONS.ORDER_UPDATE,
        permission_1.PERMISSIONS.TABLE_VIEW,
        permission_1.PERMISSIONS.TABLE_UPDATE,
        permission_1.PERMISSIONS.INGREDIENT_VIEW,
        permission_1.PERMISSIONS.MENU_VIEW,
    ],
};
//# sourceMappingURL=rolePermissions.js.map