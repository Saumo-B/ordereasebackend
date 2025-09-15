import { MenuItem } from "../models/Menu";
import { Ingredient } from "../models/Ingredients";
import { Order } from "../models/Order";
// import mongoose from "mongoose";

export async function deductInventory(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  const deductions: Record<string, number> = {};

  for (const item of order.lineItems) {
    const menuItem = await MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
    if (!menuItem){
        console.warn(`MenuItem not found for SKU: ${item.sku}`);
         continue   };
    console.log(menuItem.recipe.map(r => r.ingredient));

    for (const recipe of menuItem.recipe) { 
      const ingredientDoc = recipe.ingredient as any;
      if (!ingredientDoc || !ingredientDoc._id) {
        throw new Error(`Ingredient missing for menu item ${menuItem.name}`);
      }

      const qtyRequired = Number(recipe.qtyRequired);
      if (isNaN(qtyRequired)) {
        throw new Error(`Invalid qtyRequired for ingredient ${ingredientDoc.name}`);
      }

      const deduction = item.qty * qtyRequired;
      deductions[ingredientDoc._id.toString()] = (deductions[ingredientDoc._id.toString()] || 0) + deduction;
    }
  }

  // Fetch all ingredients
  const ingredientIds = Object.keys(deductions);
  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } });

  // Check stock
  for (const ing of ingredients) {
    const required = deductions[ing._id.toString()];
    if (ing.quantity < required) {
      throw new Error(`Not enough ${ing.name} in stock`);
    }
  }

  // Deduct in bulk
  console.log("Starting deduction for order", orderId);
  console.log("Deductions map:", deductions);
  const bulkOps = ingredients.map(ing => ({
    updateOne: {
      filter: { _id: ing._id },
      update: { $inc: { quantity: -deductions[ing._id.toString()] } }
    }
  }));

  if (bulkOps.length) {
    const result = await Ingredient.bulkWrite(bulkOps);
    console.log("Inventory deducted:", result);
  }
}
