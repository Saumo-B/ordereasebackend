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
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Menu_1 = require("../models/Menu");
const router = (0, express_1.Router)();
/**
 * GET /api/menu
 * Fetch all menu items
 */
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield Menu_1.MenuItem.find().sort({ createdAt: -1 }).lean();
        res.json(items);
    }
    catch (e) {
        next(e);
    }
}));
/**
 * POST /api/menu
 * Add a new menu item
 */
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, sku, price, category, description, imageUrl, recipe } = req.body;
        if (!name || !sku || !price) {
            return res.status(400).json({ error: "Name, SKU, and price are required" });
        }
        const item = yield Menu_1.MenuItem.create({
            name,
            sku,
            price,
            category,
            description,
            imageUrl,
            recipe,
        });
        res.status(201).json({ message: "Menu item created", item });
    }
    catch (e) {
        // ✅ Narrow the error type
        if (e instanceof Error && e.code === 11000) {
            return res.status(400).json({ error: "Duplicate SKU or name" });
        }
        if (e instanceof Error) {
            console.error("Menu create error:", e.message);
        }
        else {
            console.error("Unknown error:", e);
        }
        next(e);
    }
}));
/**
 * PATCH /api/menu/:id
 * Update menu item
 */
router.patch("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const item = yield Menu_1.MenuItem.findByIdAndUpdate(id, req.body, { new: true });
        if (!item)
            return res.status(404).json({ error: "Menu item not found" });
        res.json({ message: "Menu item updated", item });
    }
    catch (e) {
        next(e);
    }
}));
/**
 * DELETE /api/menu/:id
 * Delete menu item
 */
router.delete("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const item = yield Menu_1.MenuItem.findByIdAndDelete(id);
        if (!item)
            return res.status(404).json({ error: "Menu item not found" });
        res.json({ message: "Menu item deleted", item });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
//# sourceMappingURL=menu.js.map