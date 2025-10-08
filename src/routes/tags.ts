import express, { Request, Response } from "express";
// import mongoose from "mongoose";
import { PREDEFINED_TAGS } from "../config/predefinedTags";
import { Tag } from "../models/Tags";

const router = express.Router();

/**
 * CREATE Tag
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { identifier, name, group, multiSelect, validCatalogueKinds, createdBy } = req.body;

    if (!identifier || !name || !createdBy) {
      return res.status(400).json({ error: "identifier, name, and createdBy are required" });
    }

    const tag = new Tag({
      identifier: identifier.toLowerCase().trim(),
      name,
      group,
      multiSelect,
      validCatalogueKinds,
      createdBy,
    });

    await tag.save();
    return res.status(201).json({ message: "Tag created successfully", tag });
  } catch (err: any) {
    console.error("Tag create error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ error: "Identifier must be unique" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * READ all Tags
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userTags = await Tag.find().lean();

    return res.json({
      predefined: PREDEFINED_TAGS,
      userdefine: userTags,
    });
  } catch (err) {
    console.error("Tag fetch error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * READ single Tag
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    return res.json(tag);
  } catch (err) {
    console.error("Tag fetch error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * UPDATE Tag
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const tag = await Tag.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (!tag) return res.status(404).json({ error: "Tag not found" });

    return res.json({ message: "Tag updated successfully", tag });
  } catch (err) {
    console.error("Tag update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE Tag
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    return res.json({ message: "Tag deleted successfully" });
  } catch (err) {
    console.error("Tag delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
