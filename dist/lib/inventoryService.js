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
const Menu_1 = require("../models/Menu");
const Ingredients_1 = require("../models/Ingredients");
const Order_1 = require("../models/Order");
function deductInventory(orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const order = yield Order_1.Order.findById(orderId).populate("lineItems.menuItem");
        if (!order)
            throw new Error("Order not found");
        console.log("Starting deduction for order", orderId);
        for (const item of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findById(item.menuItem).populate("recipe.ingredient");
            if (!menuItem) {
                console.warn("MenuItem not found for ID:", item.menuItem);
                continue;
            }
            for (const recipe of menuItem.recipe) {
                const ingredient = yield Ingredients_1.Ingredient.findById(recipe.ingredient._id);
                if (!ingredient)
                    continue;
                const deduction = item.qty * recipe.qtyRequired;
                if (ingredient.quantity < deduction) {
                    throw new Error(`Not enough ${ingredient.name} in stock`);
                }
                ingredient.quantity -= deduction;
                yield ingredient.save();
                console.log(`✅ Deducted ${deduction} ${ingredient.unit} of ${ingredient.name}`);
            }
        }
    });
}
//# sourceMappingURL=inventoryService.js.map