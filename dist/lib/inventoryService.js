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
        const order = yield Order_1.Order.findById(orderId);
        if (!order)
            throw new Error("Order not found");
        // Step 1: Gather all deductions
        const deductions = [];
        for (const item of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
            if (!menuItem || !menuItem.recipe.length)
                continue;
            for (const recipe of menuItem.recipe) {
                const ingredient = recipe.ingredient;
                if (!ingredient)
                    continue;
                const deduction = item.qty * recipe.qtyRequired;
                deductions.push({ ingredientId: ingredient._id.toString(), amount: deduction, name: ingredient.name });
            }
        }
        // Step 2: Check if all ingredients have enough quantity
        for (const ded of deductions) {
            const ingredient = yield Ingredients_1.Ingredient.findById(ded.ingredientId);
            if (!ingredient)
                throw new Error(`Ingredient not found: ${ded.name}`);
            if (ingredient.quantity < ded.amount) {
                throw new Error(`Not enough ${ingredient.name} in stock`);
            }
        }
        // Step 3: Deduct stock
        for (const ded of deductions) {
            const ingredient = yield Ingredients_1.Ingredient.findById(ded.ingredientId);
            if (!ingredient)
                continue; // this should not happen
            ingredient.quantity -= ded.amount;
            yield ingredient.save();
        }
    });
}
//# sourceMappingURL=inventoryService.js.map