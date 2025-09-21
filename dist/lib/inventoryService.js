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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductInventory = deductInventory;
exports.reserveInventory = reserveInventory;
exports.releaseInventory = releaseInventory;
const Menu_1 = require("../models/Menu");
// ---- Deduct inventory after order is confirmed ----
function deductInventory(order_1) {
    return __awaiter(this, arguments, void 0, function* (order, session = null) {
        for (const item of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findById(item.menuItem)
                .populate("recipe.ingredient")
                .session(session);
            if (!menuItem)
                throw new Error(`Menu item ${item.menuItem} not found`);
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                const qtyToDeduct = r.qtyRequired * item.qty;
                ingredient.quantity -= qtyToDeduct;
                ingredient.reservedQuantity -= qtyToDeduct;
                yield ingredient.save({ session });
            }
            // Update outOfStock based on any ingredient
            menuItem.outOfStock = menuItem.recipe.some(r => {
                const ing = r.ingredient;
                return ing.quantity - ing.reservedQuantity < r.qtyRequired;
            });
            yield menuItem.save({ session });
        }
    });
}
// ---- Reserve inventory for pending order ----
function reserveInventory(order_1) {
    return __awaiter(this, arguments, void 0, function* (order, session = null) {
        for (const li of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findById(li.menuItem)
                .populate("recipe.ingredient")
                .session(session);
            if (!menuItem)
                throw new Error(`Menu item not found: ${li.menuItem}`);
            // Check availability
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                const available = (ingredient.quantity || 0) - (ingredient.reservedQuantity || 0);
                const required = r.qtyRequired * li.qty;
                if (required > available) {
                    throw new Error(`Not enough ${ingredient.name}. Available: ${available}, Required: ${required}`);
                }
                // Reserve
                ingredient.reservedQuantity += required;
                yield ingredient.save({ session });
            }
        }
    });
}
// ---- Release reserved inventory for canceled/deleted order ----
function releaseInventory(items_1) {
    return __awaiter(this, arguments, void 0, function* (items, session = null) {
        for (const it of items) {
            const menuItem = yield Menu_1.MenuItem.findById(it.menuItem)
                .populate("recipe.ingredient")
                .session(session);
            if (!menuItem)
                throw new Error("Menu item not found");
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                const qtyToRelease = r.qtyRequired * it.qty;
                ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
                yield ingredient.save({ session });
            }
            // Update outOfStock status
            menuItem.outOfStock = menuItem.recipe.some(r => {
                const ing = r.ingredient;
                return ing.quantity - ing.reservedQuantity < r.qtyRequired;
            });
            yield menuItem.save({ session });
        }
    });
}
//# sourceMappingURL=inventoryService.js.map