import { Router } from "express";
import mongoose from "mongoose";
import { Ingredient } from "../models/Ingredients";
import { MenuItem } from "../models/Menu";


const router = Router();

// // Create ingredient
// router.post("/", async (req, res, next) => {
//   try {
//     const { name, quantity, unit } = req.body;

//     if (!name || !unit) {
//       return res.status(400).json({ error: "Name and unit are required" });
//     }

//     const ingredient = await Ingredient.create({
//       name,
//       unit,
//       quantity: quantity || 0,
//     });

//     res.status(201).json({ message: "Ingredient created", ingredient });
//   } catch (e: any) {
//     if (e.code === 11000) {
//       return res.status(400).json({ error: "Ingredient name already exists" });
//     }
//     next(e);
//   }
// });

// Bulk add ingredients
router.post("/:branchId", async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const { ingredients } = req.body;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID is required in URL param" });
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "ingredients array is required" });
    }

    // Validate each ingredient
    for (const ing of ingredients) {
      if (!ing.name || !ing.unit) {
        return res.status(400).json({ error: "Each ingredient needs name and unit" });
      }
      if (ing.lowStockThreshold && ing.lowStockThreshold < 0) {
        return res.status(400).json({ error: "lowStockThreshold must be >= 0" });
      }
    }

    // Add branch from param to each ingredient
    const ingredientsWithBranch = ingredients.map((ing) => ({
      ...ing,
      branch: branchId,
    }));

    const result = await Ingredient.insertMany(ingredientsWithBranch, { ordered: false });

    res.status(201).json({
      message: "Ingredients created successfully",
      count: result.length,
    });
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(400).json({ error: "Duplicate ingredient name(s)" });
    }
    next(e);
  }
});

// Get all ingredients
router.get("/", async (req, res, next) => {
  try {
    const branchId = req.query.branch as string;

    if (!branchId) {
      return res.status(400).json({ error: "Branch ID is required" });
    }

    // Fetch ingredients for this branch
    const ingredients = await Ingredient.find({ branch: branchId })
      .select("-createdAt -updatedAt")
      .lean();

    // Add low-stock warning
    const withWarning = ingredients.map((ing) => ({
      ...ing,
      lowStockWarning: ing.quantity <= (ing.lowStockThreshold || 5),
    }));

    res.json(withWarning);
  } catch (e) {
    next(e);
  }
});

// Get ingredient by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const ingredient = await Ingredient.findById(id).lean();
    if (!ingredient) return res.status(404).json({ error: "Not found" });

    // Add low-stock warning
    const ingredientWithWarning = {
      ...ingredient,
      lowStockWarning: ingredient.quantity <= (ingredient.lowStockThreshold || 5),
    };

    res.json(ingredientWithWarning);
  } catch (e) {
    next(e);
  }
});

// Update ingredient (change name/unit/quantity)
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit, lowStockThreshold } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ error: "Not found" });

    if (name) ingredient.name = name;
    if (unit) ingredient.unit = unit;
    if (typeof quantity === "number") ingredient.quantity = quantity;
    if (typeof lowStockThreshold === "number" && lowStockThreshold >= 0) {
      ingredient.lowStockThreshold = lowStockThreshold;
    }

    await ingredient.save();
    res.json({ message: "Ingredient updated", ingredient });
  } catch (e) {
    next(e);
  }
});

// Delete ingredient
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    // Check if this ingredient is used in any menu item
    const usedInMenu = await MenuItem.findOne({ "recipe.ingredient": id });
    if (usedInMenu) {
      return res.status(400).json({
        error: `Cannot delete ingredient. It is used in menu item: ${usedInMenu.name}`,
      });
    }

    // Delete ingredient if not used
    const deleted = await Ingredient.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Ingredient not found" });

    res.json({ message: "Ingredient deleted successfully", ingredient: deleted });
  } catch (e) {
    next(e);
  }
});


export default router;
