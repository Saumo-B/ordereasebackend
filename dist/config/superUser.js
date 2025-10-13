"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPER_USER = void 0;
const permission_1 = require("../lib/permission");
exports.SUPER_USER = {
    _id: "000000000000000000000000",
    name: "dev@1",
    email: "dev@orderease.local",
    role: "dev",
    branch: null,
    permissions: Object.values(permission_1.PERMISSIONS),
    isSuper: true,
};
//# sourceMappingURL=superUser.js.map