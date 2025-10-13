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
const autoTag_1 = require("../lib/autoTag");
const router = (0, express_1.Router)();
/**
 * GET /api/menu
 * Fetch all menu items
 */
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branchId = req.query.branch;
        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required" });
        }
        const items = yield Menu_1.MenuItem.find({ branch: branchId })
            .sort({ createdAt: -1 })
            .select("-recipe -createdAt -updatedAt") // exclude recipe + timestamps
            .lean();
        res.json(items);
    }
    catch (e) {
        next(e);
    }
}));
//Get details of single item
router.get("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield Menu_1.MenuItem.findById(id)
            .populate("recipe.ingredient", "name unit quantity") // fetch ingredient details
            .lean();
        if (!item) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        res.json(item);
    }
    catch (e) {
        next(e);
    }
}));
// add single menu item
// router.post("/", async (req, res, next) => {
//   try {
//     const { name, sku, price, category, description, imageUrl, recipe } = req.body;
//     if (!name || !sku || !price) {
//       return res.status(400).json({ error: "Name, SKU, and price are required" });
//     }
//     const item = await MenuItem.create({
//       name,
//       sku,
//       price,
//       category,
//       description,
//       imageUrl,
//       recipe,
//     });
//     res.status(201).json({ message: "Menu item created", item });
//   } catch (e: unknown) {
//     // ✅ Narrow the error type
//     if (e instanceof Error && (e as any).code === 11000) {
//       return res.status(400).json({ error: "Duplicate SKU or name" });
//     }
//     if (e instanceof Error) {
//       console.error("Menu create error:", e.message);
//     } else {
//       console.error("Unknown error:", e);
//     }
//     next(e);
//   }
// });
//add bulk menu item
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { menuItems } = req.body;
        const branchId = req.query.branch;
        if (!branchId) {
            return res.status(400).json({ error: "Branch ID is required in query param" });
        }
        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            return res.status(400).json({ error: "menuItems array is required" });
        }
        // Validate each menu item
        for (const item of menuItems) {
            if (!item.name || !item.price) {
                return res.status(400).json({ error: "Each item must have name and price" });
            }
            // Auto-tagging
            item.tags = [
                ...(item.tags || []),
                ...(0, autoTag_1.autoTagMenuItem)(item.name, item.description),
            ];
            item.tags = [...new Set(item.tags)]; // Remove duplicates
            // Validate ingredient IDs if recipe provided for the base item
            if (Array.isArray(item.recipe)) {
                for (const r of item.recipe) {
                    if (!mongoose_1.default.Types.ObjectId.isValid(r.ingredient)) {
                        return res
                            .status(400)
                            .json({ error: `Invalid ingredient ID in recipe: ${r.ingredient}` });
                    }
                }
            }
            // Validate variants if they exist
            if (Array.isArray(item.variants) && item.variants.length > 0) {
                for (const variant of item.variants) {
                    if (!variant.variantName || !variant.price) {
                        return res.status(400).json({ error: "Each variant must have variantName and price" });
                    }
                    // Validate variant recipe if provided
                    if (Array.isArray(variant.recipe)) {
                        for (const r of variant.recipe) {
                            if (!mongoose_1.default.Types.ObjectId.isValid(r.ingredient)) {
                                return res
                                    .status(400)
                                    .json({ error: `Invalid ingredient ID in variant recipe: ${r.ingredient}` });
                            }
                        }
                    }
                }
            }
            // Force-assign branch from query
            item.branch = branchId;
        }
        // Insert many at once
        const result = yield Menu_1.MenuItem.insertMany(menuItems, { ordered: false });
        return res.status(201).json({
            message: "Menu items created successfully",
            count: result.length,
        });
    }
    catch (e) {
        console.error("MenuItem creation failed:", e);
        if (e.code === 11000) {
            return res.status(400).json({ error: "Duplicate name detected" });
        }
        if (e.name === "ValidationError") {
            return res.status(400).json({ error: e.message });
        }
        if (e.name === "CastError") {
            return res
                .status(400)
                .json({ error: `Invalid value for field: ${e.path}` });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**************************
 * PATCH /api/menu/:id
 * Update menu item
 **************************/
router.patch("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const { menuItem } = req.body; // Assuming the patch data is inside "menuItem"
        // If variants are provided, validate them
        if (menuItem && Array.isArray(menuItem.variants)) {
            for (const variant of menuItem.variants) {
                if (!variant.variantName || !variant.price) {
                    return res.status(400).json({ error: "Each variant must have variantName and price" });
                }
                // Validate variant recipe if provided
                if (Array.isArray(variant.recipe)) {
                    for (const r of variant.recipe) {
                        if (!mongoose_1.default.Types.ObjectId.isValid(r.ingredient)) {
                            return res.status(400).json({ error: `Invalid ingredient ID in variant recipe: ${r.ingredient}` });
                        }
                    }
                }
            }
        }
        // If the base item's recipe is provided in the update, validate it
        if (menuItem && Array.isArray(menuItem.recipe)) {
            for (const r of menuItem.recipe) {
                if (!mongoose_1.default.Types.ObjectId.isValid(r.ingredient)) {
                    return res.status(400).json({ error: `Invalid ingredient ID in recipe: ${r.ingredient}` });
                }
            }
        }
        // Auto-tagging for name and description (optional)
        if (menuItem && menuItem.name && menuItem.description) {
            menuItem.tags = [
                ...(menuItem.tags || []),
                ...(0, autoTag_1.autoTagMenuItem)(menuItem.name, menuItem.description),
            ];
            menuItem.tags = [...new Set(menuItem.tags)]; // Remove duplicates
        }
        // Update the menu item in the database
        const item = yield Menu_1.MenuItem.findByIdAndUpdate(id, menuItem, { new: true });
        if (!item)
            return res.status(404).json({ error: "Menu item not found" });
        res.json({ message: "Menu item updated", item });
    }
    catch (e) {
        console.error("Error updating MenuItem:", e);
        // Handle Mongoose ValidationError
        if (e instanceof mongoose_1.default.Error.ValidationError) {
            return res.status(400).json({ error: e.message });
        }
        // Handle Mongoose CastError (with 'path' property)
        if (e instanceof mongoose_1.default.Error.CastError) {
            // Access 'path' property for CastError
            return res.status(400).json({ error: `Invalid value for field: ${e.path}` });
        }
        // Handle any other generic errors
        if (e instanceof Error) {
            return res.status(500).json({ error: e.message });
        }
        // If the error doesn't match any known type, return a generic internal server error
        return res.status(500).json({ error: "Unknown error occurred" });
    }
}));
/************************
 * DELETE /api/menu/:id
 * Delete menu item
 *************************/
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