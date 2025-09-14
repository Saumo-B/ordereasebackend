import { Router } from "express";
import mongoose from "mongoose";
import { Ingredient } from "../models/Ingredients";

const router = Router();

// Create ingredient
router.post("/", async (req, res, next) => {
  try {
    const { name, quantity, unit } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: "Name and unit are required" });
    }

    const ingredient = await Ingredient.create({
      name,
      unit,
      quantity: quantity || 0,
    });

    res.status(201).json({ message: "Ingredient created", ingredient });
  } catch (e: any) {
    if (e.code === 11000) {
      return res.status(400).json({ error: "Ingredient name already exists" });
    }
    next(e);
  }
});

// Get all ingredients
router.get("/", async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find().lean();
    res.json(ingredients);
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

    res.json(ingredient);
  } catch (e) {
    next(e);
  }
});

// Update ingredient (change name/unit/quantity)
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ error: "Not found" });

    if (name) ingredient.name = name;
    if (unit) ingredient.unit = unit;
    if (typeof quantity === "number") ingredient.quantity = quantity; // override quantity

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

    const deleted = await Ingredient.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    res.json({ message: "Ingredient deleted", ingredient: deleted });
  } catch (e) {
    next(e);
  }
});

export default router;
