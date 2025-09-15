import { MenuItem } from "../models/Menu";
import { Ingredient } from "../models/Ingredients";
import { Order } from "../models/Order";
// import mongoose from "mongoose";

export async function deductInventory(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  console.log("Starting deduction for order", orderId);

  for (const item of order.lineItems) {
    const menuItem = await MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
    if (!menuItem) {
      console.warn("MenuItem not found for SKU:", item.sku);
      continue;
    }

    for (const recipe of menuItem.recipe) {
      const ingredient = await Ingredient.findById(recipe.ingredient._id);
      if (!ingredient) continue;

      const deduction = item.qty * recipe.qtyRequired;

      if (ingredient.quantity < deduction) {
        throw new Error(`Not enough ${ingredient.name} in stock`);
      }

      ingredient.quantity -= deduction;
      await ingredient.save();

      console.log(`Deducted ${deduction} ${ingredient.unit} of ${ingredient.name}`);
    }
  }
}
