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
exports.reserveInventory = reserveInventory;
exports.releaseInventory = releaseInventory;
exports.deductInventory = deductInventory;
const Menu_1 = require("../models/Menu");
// ------------------ RESERVE INVENTORY ------------------
function reserveInventory(order_1) {
    return __awaiter(this, arguments, void 0, function* (order, session = null) {
        for (const li of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findById(li.menuItem)
                .populate("recipe.ingredient")
                .session(session);
            if (!menuItem)
                throw new Error(`Menu item not found: ${li.menuItem}`);
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                if (!ingredient || typeof ingredient.quantity !== "number") {
                    throw new Error(`Ingredient not populated for menu item ${menuItem.name}`);
                }
                const requiredQty = r.qtyRequired * li.qty;
                const available = ingredient.quantity - ingredient.reservedQuantity;
                if (requiredQty > available) {
                    throw new Error(`Not enough ${ingredient.name}. Available: ${available}, Required: ${requiredQty}`);
                }
                // ✅ Increment reserved quantity
                ingredient.reservedQuantity += requiredQty;
                yield ingredient.save({ session });
            }
        }
    });
}
// ------------------ RELEASE INVENTORY ------------------
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
                // ✅ Decrement reserved quantity safely
                ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
                yield ingredient.save({ session });
            }
        }
    });
}
// ------------------ DEDUCT INVENTORY ------------------
function deductInventory(order_1) {
    return __awaiter(this, arguments, void 0, function* (order, session = null) {
        for (const li of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findById(li.menuItem)
                .populate("recipe.ingredient")
                .session(session);
            if (!menuItem)
                throw new Error(`Menu item not found: ${li.menuItem}`);
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                if (!ingredient)
                    throw new Error(`Ingredient not populated for menu item ${menuItem.name}`);
                const qtyToDeduct = r.qtyRequired * li.qty;
                if (ingredient.quantity - qtyToDeduct < 0) {
                    throw new Error(`Not enough ${ingredient.name}. Available: ${ingredient.quantity}, Required: ${qtyToDeduct}`);
                }
                ingredient.quantity -= qtyToDeduct;
                ingredient.reservedQuantity -= qtyToDeduct;
                yield ingredient.save({ session });
            }
        }
    });
}
//# sourceMappingURL=inventoryService.js.map