import { Router } from "express";
import mongoose from "mongoose";
import { MenuItem } from "../models/Menu";

const router = Router();

/**
 * GET /api/menu
 * Fetch all menu items
 */
router.get("/", async (req, res, next) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/menu
 * Add a new menu item
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, sku, price, category, description, imageUrl, recipe } = req.body;

    if (!name || !sku || !price) {
      return res.status(400).json({ error: "Name, SKU, and price are required" });
    }

    const item = await MenuItem.create({
      name,
      sku,
      price,
      category,
      description,
      imageUrl,
      recipe,
    });

    res.status(201).json({ message: "Menu item created", item });
  } catch (e: unknown) {
    // ✅ Narrow the error type
    if (e instanceof Error && (e as any).code === 11000) {
      return res.status(400).json({ error: "Duplicate SKU or name" });
    }

    if (e instanceof Error) {
      console.error("Menu create error:", e.message);
    } else {
      console.error("Unknown error:", e);
    }

    next(e);
  }
});

/**
 * PATCH /api/menu/:id
 * Update menu item
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    const item = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    res.json({ message: "Menu item updated", item });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/menu/:id
 * Delete menu item
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });

    res.json({ message: "Menu item deleted", item });
  } catch (e) {
    next(e);
  }
});

export default router;
