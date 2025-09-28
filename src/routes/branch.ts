import { Router } from "express";
import { Branch, IBranch } from "../models/Branch";
import { authenticate } from "../middleware/auth";

const router = Router();

// ✅ Create Branch
router.post("/",authenticate, async (req, res, next) => {
  try {
    const branch = new Branch(req.body as IBranch);
    await branch.save();
    res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
});

// ✅ Get All Branches
router.get("/",authenticate, async (req, res, next) => {
  try {
    const branches = await Branch.find().lean();
    res.json(branches);
  } catch (err) {
    next(err);
  }
});

// ✅ Get Single Branch
router.get("/:id",authenticate, async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id).lean();
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    next(err);
  }
});

// ✅ Update Branch
router.put("/:id",authenticate, async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    next(err);
  }
});

// ✅ Delete Branch
router.delete("/:id",authenticate, async (req, res, next)=> {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
