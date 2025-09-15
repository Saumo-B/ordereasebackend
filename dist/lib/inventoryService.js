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
        //  Gather all deductions in a map: { ingredientId => totalQtyToDeduct }
        const deductions = {};
        for (const item of order.lineItems) {
            const menuItem = yield Menu_1.MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
            if (!menuItem || !menuItem.recipe.length)
                continue;
            for (const recipe of menuItem.recipe) {
                const ingredientDoc = recipe.ingredient;
                if (!ingredientDoc || !ingredientDoc._id)
                    continue;
                const ingredientId = ingredientDoc._id.toString();
                const qtyRequired = Number(recipe.qtyRequired);
                const totalDeduction = item.qty * qtyRequired;
                deductions[ingredientId] = (deductions[ingredientId] || 0) + totalDeduction;
            }
        }
        //  Fetch all ingredients in one query
        const ingredientIds = Object.keys(deductions);
        const ingredients = yield Ingredients_1.Ingredient.find({ _id: { $in: ingredientIds } });
        // Check if any ingredient is insufficient
        for (const ing of ingredients) {
            const required = deductions[ing._id.toString()];
            if (ing.quantity < required) {
                throw new Error(`Not enough ${ing.name} in stock`);
            }
        }
        //  Deduct all ingredients in bulk
        const bulkOps = ingredients.map(ing => ({
            updateOne: {
                filter: { _id: ing._id },
                update: { $inc: { quantity: -deductions[ing._id.toString()] } }
            }
        }));
        if (bulkOps.length) {
            yield Ingredients_1.Ingredient.bulkWrite(bulkOps);
        }
    });
}
//# sourceMappingURL=inventoryService.js.map