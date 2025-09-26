import { Router } from "express";
import mongoose from "mongoose";
import { MenuItem } from "../models/Menu";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * GET /api/menu
 * Fetch all menu items
 */
router.get("/", async (req, res, next) => {
  try {
    const branchId = req.query.branch; 
    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }
    const items = await MenuItem.find({ branch: branchId })
      .sort({ createdAt: -1 })
      .select("-recipe -createdAt -updatedAt") // exclude recipe + timestamps
      .lean();

    res.json(items);
  } catch (e) {
    next(e);
  }
});

//Get details of single item
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id)
      .populate("recipe.ingredient", "name unit quantity") // fetch ingredient details
      .lean();

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(item);
  } catch (e) {
    next(e);
  }
});

// add single menu item
// router.post("/", async (req, res, next) => {
//   try {
//     const { name, sku, price, category, description, imageUrl, recipe } = req.body;

//     if (!name || !sku || !price) {
//       return res.status(400).json({ error: "Name, SKU, and price are required" });
//     }

//     const item = await MenuItem.create({
//       name,
//       sku,
//       price,
//       category,
//       description,
//       imageUrl,
//       recipe,
//     });

//     res.status(201).json({ message: "Menu item created", item });
//   } catch (e: unknown) {
//     // ✅ Narrow the error type
//     if (e instanceof Error && (e as any).code === 11000) {
//       return res.status(400).json({ error: "Duplicate SKU or name" });
//     }

//     if (e instanceof Error) {
//       console.error("Menu create error:", e.message);
//     } else {
//       console.error("Unknown error:", e);
//     }

//     next(e);
//   }
// });

//add bulk menu item
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { menuItems } = req.body;

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return res.status(400).json({ error: "menuItems array is required" });
    }

    // 🔑 Branch comes from the logged-in user (staff/admin)
    const branchId = req.user?.branch; 
    if (!branchId) {
      return res.status(403).json({ error: "User is not linked to a branch" });
    }

    // Validate each menu item
    for (const item of menuItems) {
      if (!item.name || !item.price) {
        return res.status(400).json({ error: "Each item must have name and price" });
      }

      // Validate ingredient IDs if recipe provided
      if (Array.isArray(item.recipe)) {
        for (const r of item.recipe) {
          if (!mongoose.Types.ObjectId.isValid(r.ingredient)) {
            return res
              .status(400)
              .json({ error: `Invalid ingredient ID: ${r.ingredient}` });
          }
        }
      }

      // Force-assign branch
      item.branch = branchId;
    }

    // Insert many at once
    const result = await MenuItem.insertMany(menuItems, { ordered: false });

    return res.status(201).json({
      message: "Menu items created successfully",
      count: result.length,
    });
  } catch (e: any) {
    console.error("MenuItem creation failed:", e);

    if (e.code === 11000) {
      return res.status(400).json({ error: "Duplicate name detected" });
    }
    if (e.name === "ValidationError") {
      return res.status(400).json({ error: e.message });
    }
    if (e.name === "CastError") {
      return res
        .status(400)
        .json({ error: `Invalid value for field: ${e.path}` });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

/**************************
 * PATCH /api/menu/:id
 * Update menu item
 **************************/
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

/************************
 * DELETE /api/menu/:id
 * Delete menu item
 *************************/
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
