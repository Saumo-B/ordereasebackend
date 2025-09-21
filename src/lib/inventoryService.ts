import mongoose, { Types } from "mongoose";
import { Ingredient } from "../models/Ingredients";
import { MenuItem } from "../models/Menu";
import { OrderDoc } from "../models/Order";

// ---- Types ----
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

// LineItem input type
type LineItemInput = { menuItem: Types.ObjectId; qty: number };

// ---- Deduct inventory after order is confirmed ----
export async function deductInventory(order: OrderDoc, session: mongoose.ClientSession | null = null) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as unknown as IngredientDoc;
      const qtyToDeduct = r.qtyRequired * li.qty;

      ingredient.quantity -= qtyToDeduct;
      ingredient.reservedQuantity -= qtyToDeduct;

      if (ingredient.quantity < 0) {
        throw new Error(`Negative stock for ${ingredient.name} after deduction`);
      }

      await ingredient.save({ session });
    }
  }
}
// ---- Reserve inventory for pending order ----
export async function reserveInventory(order: OrderDoc, session: mongoose.ClientSession | null = null) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as unknown as IngredientDoc;

      if (!ingredient || typeof ingredient.quantity !== "number") {
        throw new Error(`Ingredient not properly populated for menu item ${menuItem.name}`);
      }

      const requiredQty = r.qtyRequired * li.qty;
      const available = ingredient.quantity - ingredient.reservedQuantity;

      if (requiredQty > available) {
        throw new Error(`Not enough ${ingredient.name}. Available: ${available}, Required: ${requiredQty}`);
      }

      // Reserve stock
      ingredient.reservedQuantity += requiredQty;
      await ingredient.save({ session });
    }
  }
}


// ---- Release reserved inventory for canceled/deleted order ----
export async function releaseInventory(items: LineItemInput[], session: mongoose.ClientSession | null = null) {
  for (const it of items) {
    const menuItem = await MenuItem.findById(it.menuItem)
      .populate("recipe.ingredient")
      .session(session) as MenuItemDoc | null;

    if (!menuItem) throw new Error("Menu item not found");

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as IngredientDoc;
      const qtyToRelease = r.qtyRequired * it.qty;

      ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
      await ingredient.save({ session });
    }

    // Update outOfStock status
    menuItem.outOfStock = menuItem.recipe.some(r => {
      const ing = r.ingredient as IngredientDoc;
      return ing.quantity - ing.reservedQuantity < r.qtyRequired;
    });

    await menuItem.save({ session });
  }
}
