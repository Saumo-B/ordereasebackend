import mongoose, { Types } from "mongoose";
import { Ingredient } from "../models/Ingredients";
import { MenuItem } from "../models/Menu";
import { OrderDoc } from "../models/Order";

// // Inline types
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

type LineItem = {
  menuItem: Types.ObjectId;
  served: boolean;
  qty: number;
  price: number;
};



// Deduct inventory function
export async function deductInventory(order: OrderDoc) {
  for (const item of order.lineItems) {
    const menuItem = await mongoose.model("MenuItem").findById(item.menuItem)
      .populate("recipe.ingredient") as MenuItemDoc | null;

    if (!menuItem) throw new Error(`Menu item ${item.menuItem} not found`);

    for (const ing of menuItem.recipe) {
      const ingredient = ing.ingredient as IngredientDoc;
      const qtyToDeduct = ing.qtyRequired * item.qty;

      ingredient.quantity -= qtyToDeduct;
      ingredient.reservedQuantity -= qtyToDeduct;
      await ingredient.save();

      menuItem.outOfStock = ingredient.quantity - ingredient.reservedQuantity <= 0;
      await menuItem.save();
    }
  }
}


// --- Functions using inline types ---

// types
type LineItemInput = { menuItem: Types.ObjectId; qty: number };

export async function reserveInventory(order: OrderDoc) {
  for (const item of order.lineItems) {
    const menuItem = await mongoose.model("MenuItem")
      .findById(item.menuItem)
      .populate("recipe.ingredient") as MenuItemDoc | null;

    if (!menuItem) throw new Error(`Menu item ${item.menuItem} not found`);

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as IngredientDoc;
      const requiredQty = r.qtyRequired * item.qty;

      if (ingredient.quantity - ingredient.reservedQuantity < requiredQty) {
        throw new Error(`Ingredient ${ingredient.name} is not enough`);
      }

      ingredient.reservedQuantity += requiredQty;
      await ingredient.save();

      if (ingredient.quantity - ingredient.reservedQuantity <= 0) {
        menuItem.outOfStock = true;
        await menuItem.save();
      }
    }
  }
}

// Release based on items
export async function releaseInventory(items: LineItemInput[]) {
  for (const it of items) {
    const menuItem = await mongoose.model("MenuItem")
      .findById(it.menuItem)
      .populate("recipe.ingredient") as MenuItemDoc | null;

    if (!menuItem) throw new Error("Menu item not found");

    for (const r of menuItem.recipe) {
      const ingredient = r.ingredient as IngredientDoc;
      const qtyToRelease = r.qtyRequired * it.qty;

      ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
      await ingredient.save();
    }

    menuItem.outOfStock = menuItem.recipe.some((r) => {
      const ingredient = r.ingredient as IngredientDoc;
      return ingredient.quantity - ingredient.reservedQuantity < r.qtyRequired;
    });

    await menuItem.save();
  }
}