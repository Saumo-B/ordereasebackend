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

export async function reserveInventory(
  order: OrderDoc,
  session: mongoose.ClientSession | null = null
) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient") // populate recipe with ingredient documents
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      // Narrowing down the type of ingredient
      let ingredient: IngredientDoc | null = null;
      if (r.ingredient instanceof mongoose.Types.ObjectId) {
        // The ingredient is just an ObjectId, not populated
        ingredient = await Ingredient.findById(r.ingredient).session(session);
      } else {
        // The ingredient is already populated (IngredientDoc)
        ingredient = r.ingredient as IngredientDoc;
      }

      if (!ingredient || typeof ingredient.quantity !== "number") {
        throw new Error(`Ingredient not populated or invalid for menu item ${menuItem.name}`);
      }

      const status = li.status as { active: number; served: number };
      const requiredQty = r.qtyRequired * status.active;
      const available = ingredient.quantity - ingredient.reservedQuantity;

      if (requiredQty > available) {
        throw new Error(
          `Not enough ${ingredient.name}. Available: ${available}, Required: ${requiredQty}`
        );
      }

      // ✅ Increment reserved quantity
      ingredient.reservedQuantity += requiredQty;
      await ingredient.save({ session });
    }
  }
}

// ------------------ RELEASE INVENTORY ------------------

export async function releaseInventory(
  items: { menuItem: Types.ObjectId; qty: number }[],
  session: mongoose.ClientSession | null = null
) {
  for (const it of items) {
    const menuItem = await MenuItem.findById(it.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error("Menu item not found");

    for (const r of menuItem.recipe) {
      // Narrowing down the type of ingredient
      let ingredient: IngredientDoc | null = null;
      if (r.ingredient instanceof mongoose.Types.ObjectId) {
        // The ingredient is just an ObjectId, not populated
        ingredient = await Ingredient.findById(r.ingredient).session(session);
      } else {
        // The ingredient is already populated (IngredientDoc)
        ingredient = r.ingredient as IngredientDoc;
      }

      const qtyToRelease = r.qtyRequired * it.qty;

      // ✅ Decrement reserved quantity safely
      if (ingredient) {
        ingredient.reservedQuantity = Math.max(0, ingredient.reservedQuantity - qtyToRelease);
        await ingredient.save({ session });
      }
    }
  }
}

// ------------------ DEDUCT INVENTORY ------------------

export async function deductInventory(
  order: OrderDoc,
  session: mongoose.ClientSession | null = null
) {
  for (const li of order.lineItems) {
    const menuItem = await MenuItem.findById(li.menuItem)
      .populate("recipe.ingredient")
      .session(session);

    if (!menuItem) throw new Error(`Menu item not found: ${li.menuItem}`);

    for (const r of menuItem.recipe) {
      // Narrowing down the type of ingredient
      let ingredient: IngredientDoc | null = null;
      if (r.ingredient instanceof mongoose.Types.ObjectId) {
        // The ingredient is just an ObjectId, not populated
        ingredient = await Ingredient.findById(r.ingredient).session(session);
      } else {
        // The ingredient is already populated (IngredientDoc)
        ingredient = r.ingredient as IngredientDoc;
      }

      if (!ingredient) throw new Error(`Ingredient not populated for menu item ${menuItem.name}`);

      const status = li.status as { active: number; served: number };
      const qtyToDeduct = r.qtyRequired * status.active;

      if (ingredient.quantity - qtyToDeduct < 0) {
        throw new Error(
          `Not enough ${ingredient.name}. Available: ${ingredient.quantity}, Required: ${qtyToDeduct}`
        );
      }

      ingredient.quantity -= qtyToDeduct;
      ingredient.reservedQuantity -= qtyToDeduct;

      await ingredient.save({ session });
    }
  }
}
