import { MenuItem } from "../models/Menu";
import { Ingredient } from "../models/Ingredients";
import { Order } from "../models/Order";
import mongoose from "mongoose";

export async function deductInventory(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  //  Gather all deductions in a map: { ingredientId => totalQtyToDeduct }
  const deductions: Record<string, number> = {};

  for (const item of order.lineItems) {
    const menuItem = await MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
    if (!menuItem || !menuItem.recipe.length) continue;

    for (const recipe of menuItem.recipe) {
      const ingredientDoc = recipe.ingredient as any;
      if (!ingredientDoc || !ingredientDoc._id) continue;

      const ingredientId = ingredientDoc._id.toString();
      const qtyRequired = Number(recipe.qtyRequired);
      const totalDeduction = item.qty * qtyRequired;

      deductions[ingredientId] = (deductions[ingredientId] || 0) + totalDeduction;
    }
  }

  //  Fetch all ingredients in one query
  const ingredientIds = Object.keys(deductions);
  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } });

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
    await Ingredient.bulkWrite(bulkOps);
  }
}
