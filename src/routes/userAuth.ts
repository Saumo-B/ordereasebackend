import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
// import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/role";
// import { PERMISSION } from "../lib/permission";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Generate JWT
const generateToken = (user: IUser) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ----------------------
// Register User
// ----------------------
router.post(
  "/register",
  // authenticate,
  async (req: Request & { user?: IUser }, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.role === "manager" && role !== "staff") {
        return res
          .status(403)
          .json({ error: "Manager can only create staff accounts" });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || "staff",
      });

      await user.save();

      res.status(201).json({ message: "User registered", user });
    } catch (e) {
      next(e);
    }
  }
);

// ----------------------
// Login
// ----------------------
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

      const token = generateToken(user);

      res.json({ token, user });
    } catch (e) {
      next(e);
    }
  }
);

// ----------------------
// Assign role/permissions to staff
// ----------------------
router.patch(
  "/assign/:id",
  // authenticate,
  requireRole(["owner", "manager"]),
  async (req: Request & { user?: IUser }, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role, permissions } = req.body;

      const staff = await User.findById(id);
      if (!staff) return res.status(404).json({ error: "User not found" });

      if (staff.role !== "staff") {
        return res
          .status(400)
          .json({ error: "Only staff can be assigned roles/permissions" });
      }

      if (req.user?.role === "manager" && role && role !== "staff") {
        return res
          .status(403)
          .json({ error: "Manager cannot assign non-staff roles" });
      }

      if (role) staff.role = role;
      if (Array.isArray(permissions)) staff.permissions = permissions;

      await staff.save();

      res.json({ message: "Staff updated", staff });
    } catch (e) {
      next(e);
    }
  }
);

// ----------------------
// Profile
// ----------------------
router.get(
  "/profile",
  // authenticate,
  async (req: Request & { user?: IUser }, res: Response) => {
    res.json({ user: req.user });
  }
);

// ----------------------
// Delete User
// ----------------------
router.delete(
  "/:id",
  // authenticate,
  requireRole(["owner","manager"]),
  async (req: Request & { user?: IUser }, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "User not found" });

      res.json({ message: "User deleted", user: deleted });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
