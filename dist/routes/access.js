"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Access_1 = require("../models/Access"); // Import the AccessControl model
const router = express_1.default.Router();
// 1. POST API: Create or Add New Access Control Settings
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const { orders, dashboard, salesReport, inventory, menu, roles, branches, } = req.body;
        // Create a new AccessControl document
        const newAccessControl = new Access_1.AccessControl({
            orders: {
                type: (_a = orders === null || orders === void 0 ? void 0 : orders.type) !== null && _a !== void 0 ? _a : true,
                branchSelector: (_b = orders === null || orders === void 0 ? void 0 : orders.branchSelector) !== null && _b !== void 0 ? _b : false,
            },
            dashboard: {
                type: (_c = dashboard === null || dashboard === void 0 ? void 0 : dashboard.type) !== null && _c !== void 0 ? _c : true,
                branchSelector: (_d = dashboard === null || dashboard === void 0 ? void 0 : dashboard.branchSelector) !== null && _d !== void 0 ? _d : false,
            },
            salesReport: salesReport !== null && salesReport !== void 0 ? salesReport : false,
            inventory: {
                type: (_e = inventory === null || inventory === void 0 ? void 0 : inventory.type) !== null && _e !== void 0 ? _e : false,
                branchSelector: (_f = inventory === null || inventory === void 0 ? void 0 : inventory.branchSelector) !== null && _f !== void 0 ? _f : false,
            },
            menu: {
                type: (_g = menu === null || menu === void 0 ? void 0 : menu.type) !== null && _g !== void 0 ? _g : true,
                branchSelector: (_h = menu === null || menu === void 0 ? void 0 : menu.branchSelector) !== null && _h !== void 0 ? _h : false,
            },
            roles: roles !== null && roles !== void 0 ? roles : false,
            branches: branches !== null && branches !== void 0 ? branches : false,
        });
        // Save the new access control settings to the database
        const savedAccessControl = yield newAccessControl.save();
        res.status(201).json({
            message: "Access control settings created successfully",
            accessControl: savedAccessControl,
        });
    }
    catch (error) {
        console.error("Error creating access control:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// 2. GET API: Retrieve Access Control Settings
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch the access control settings
        const accessControl = yield Access_1.AccessControl.findOne({}).select("-createdAt -_id -updatedAt -__v");
        if (!accessControl) {
            return res.status(404).json({ error: "Access control settings not found" });
        }
        res.json({ accessControl });
    }
    catch (error) {
        console.error("Error fetching access control settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
// 3. PATCH API: Update Access Control Settings
router.patch("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { orders, dashboard, salesReport, inventory, menu, roles, branches, ordersBranchSelector, dashboardBranchSelector, inventoryBranchSelector, menuBranchSelector, } = req.body;
    try {
        // Find the single AccessControl document (since you know there's only one)
        const accessControl = yield Access_1.AccessControl.findOne();
        if (!accessControl) {
            return res.status(404).json({ error: "Access control settings not found" });
        }
        // Update the fields based on the request body
        // Orders
        if (orders !== undefined)
            accessControl.orders.type = orders;
        if (ordersBranchSelector !== undefined)
            accessControl.orders.branchSelector = ordersBranchSelector;
        // Dashboard
        if (dashboard !== undefined)
            accessControl.dashboard.type = dashboard;
        if (dashboardBranchSelector !== undefined)
            accessControl.dashboard.branchSelector = dashboardBranchSelector;
        // Sales Report
        if (salesReport !== undefined)
            accessControl.salesReport = salesReport;
        // Inventory
        if (inventory !== undefined)
            accessControl.inventory.type = inventory; // Make sure it's a Boolean
        if (inventoryBranchSelector !== undefined)
            accessControl.inventory.branchSelector = inventoryBranchSelector;
        // Menu
        if (menu !== undefined)
            accessControl.menu.type = menu; // Make sure it's a Boolean
        if (menuBranchSelector !== undefined)
            accessControl.menu.branchSelector = menuBranchSelector;
        // Roles
        if (roles !== undefined)
            accessControl.roles = roles;
        // Branches
        if (branches !== undefined)
            accessControl.branches = branches;
        // Save the updated document
        const updatedAccessControl = yield accessControl.save();
        res.json({
            message: "Access control settings updated successfully",
            accessControl: updatedAccessControl,
        });
    }
    catch (error) {
        console.error("Error updating access control settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=access.js.map