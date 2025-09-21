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
exports.deductInventory = deductInventory;
exports.reserveInventory = reserveInventory;
exports.releaseInventory = releaseInventory;
const mongoose_1 = __importDefault(require("mongoose"));
// Deduct inventory function
function deductInventory(order) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const item of order.lineItems) {
            const menuItem = yield mongoose_1.default.model("MenuItem").findById(item.menuItem)
                .populate("recipe.ingredient");
            if (!menuItem)
                throw new Error(`Menu item ${item.menuItem} not found`);
            for (const ing of menuItem.recipe) {
                const ingredient = ing.ingredient;
                const qtyToDeduct = ing.qtyRequired * item.qty;
                ingredient.quantity -= qtyToDeduct;
                ingredient.reservedQuantity -= qtyToDeduct;
                yield ingredient.save();
                menuItem.outOfStock = ingredient.quantity - ingredient.reservedQuantity <= 0;
                yield menuItem.save();
            }
        }
    });
}
function reserveInventory(order) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const item of order.lineItems) {
            const menuItem = yield mongoose_1.default.model("MenuItem")
                .findById(item.menuItem)
                .populate("recipe.ingredient");
            if (!menuItem)
                throw new Error(`Menu item ${item.menuItem} not found`);
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                const requiredQty = r.qtyRequired * item.qty;
                if (ingredient.quantity - ingredient.reservedQuantity < requiredQty) {
                    throw new Error(`Ingredient ${ingredient.name} is not enough`);
                }
                ingredient.reservedQuantity += requiredQty;
                yield ingredient.save();
                if (ingredient.quantity - ingredient.reservedQuantity <= 0) {
                    menuItem.outOfStock = true;
                    yield menuItem.save();
                }
            }
        }
    });
}
// Release based on items
function releaseInventory(items) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const it of items) {
            const menuItem = yield mongoose_1.default.model("MenuItem")
                .findById(it.menuItem)
                .populate("recipe.ingredient");
            if (!menuItem)
                throw new Error("Menu item not found");
            for (const r of menuItem.recipe) {
                const ingredient = r.ingredient;
                const qtyToRelease = r.qtyRequired * it.qty;
                ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
                yield ingredient.save();
            }
            menuItem.outOfStock = menuItem.recipe.some((r) => {
                const ingredient = r.ingredient;
                return ingredient.quantity - ingredient.reservedQuantity < r.qtyRequired;
            });
            yield menuItem.save();
        }
    });
}
//# sourceMappingURL=inventoryService.js.map