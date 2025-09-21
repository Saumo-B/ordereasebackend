import mongoose, { Types } from "mongoose";
import { OrderDoc } from "../models/Order";
import { MenuItem } from "../models/Menu";
import { Ingredient } from "../models/Ingredients";

// Inline types
type IngredientDoc = mongoose.Document & {
  name: string;
  quantity: number;
  reservedQuantity: number;
};

type Recipe = {
  ingredient: Types.ObjectId | IngredientDoc; // populated or ObjectId
  qtyRequired: number;
};

type MenuItemDoc = mongoose.Document & {
  name: string;
  price: number;
  outOfStock: boolean;
  recipe: Recipe[];
};

// ------------------ RESERVE INVENTORY ------------------
export async function reserveInventory(order: OrderDoc, session: mongoose.ClientSession | null = null) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as unknown as IngredientDoc;

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
      await ingredient.save({ session });
    }
  }
}

// ------------------ RELEASE INVENTORY ------------------
export async function releaseInventory(items: { menuItem: Types.ObjectId; qty: number }[], session: mongoose.ClientSession | null = null) {
  for (const it of items) {
    const menuItem = await MenuItem.findById(it.menuItem)
      .populate("recipe.ingredient")
      .session(session) as MenuItemDoc | null;

    if (!menuItem) throw new Error("Menu item not found");

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as unknown as IngredientDoc;
      const qtyToRelease = r.qtyRequired * it.qty;

      // ✅ Decrement reserved quantity safely
      ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
      await ingredient.save({ session });
    }
  }
}

// ------------------ DEDUCT INVENTORY ------------------
export async function deductInventory(order: OrderDoc, session: mongoose.ClientSession | null = null) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as unknown as IngredientDoc;

      if (!ingredient) throw new Error(`Ingredient not populated for menu item ${menuItem.name}`);

      const qtyToDeduct = r.qtyRequired * li.qty;

      if (ingredient.quantity - qtyToDeduct < 0) {
        throw new Error(`Not enough ${ingredient.name}. Available: ${ingredient.quantity}, Required: ${qtyToDeduct}`);
      }

      // ✅ Deduct both quantity and reservedQuantity
      ingredient.quantity -= qtyToDeduct;
      ingredient.reservedQuantity -= qtyToDeduct;

      await ingredient.save({ session });
    }
  }
}
