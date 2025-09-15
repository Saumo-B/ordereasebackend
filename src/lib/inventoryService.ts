import { MenuItem } from "../models/Menu";
import { Ingredient } from "../models/Ingredients";
import { Order } from "../models/Order";

export async function deductInventory(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  // Step 1: Gather all deductions
  const deductions: { ingredientId: string; amount: number; name: string }[] = [];

  for (const item of order.lineItems) {
    const menuItem = await MenuItem.findOne({ sku: item.sku }).populate("recipe.ingredient");
    if (!menuItem || !menuItem.recipe.length) continue;

    for (const recipe of menuItem.recipe) {
      const ingredient = recipe.ingredient as any;
      if (!ingredient) continue;

      const qtyRequired = parseFloat(recipe.qtyRequired as any);
      const deduction = item.qty * qtyRequired;
      deductions.push({ ingredientId: ingredient._id.toString(), amount: deduction, name: ingredient.name });
    }
  }

  // Step 2: Check if all ingredients have enough quantity
  for (const ded of deductions) {
    const ingredient = await Ingredient.findById(ded.ingredientId);
    if (!ingredient) throw new Error(`Ingredient not found: ${ded.name}`);
    if (ingredient.quantity < ded.amount) {
      throw new Error(`Not enough ${ingredient.name} in stock`);
    }
  }

  // Step 3: Deduct stock
  for (const ded of deductions) {
    const ingredient = await Ingredient.findById(ded.ingredientId);
    if (!ingredient) continue; // this should not happen
    ingredient.quantity -= ded.amount;
    await ingredient.save();
  }
}
