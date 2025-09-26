import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { authenticate } from "../middleware/auth";
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
  authenticate,
  async (req: Request & { user?: IUser }, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, role } = req.body;
      const branchId = req.query.branch as string;

      if (!branchId) {
        return res.status(400).json({ error: "Branch ID is required in query param" });
      }

      // Check if email already exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // TODO: Add hashing in production
      // const hashedPassword = await bcrypt.hash(password, 10);

      // Assign branch explicitly
      const user = new User({
        name,
        email,
        password,
        role: role || "staff",
        branch: branchId,
      });

      await user.save();

      res.status(201).json({
        message: "User registered",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          branch: user.branch,
        },
      });
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
      const user = await User.findOne({ email }).populate("branch", "name");
      // const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid Email" });
      }

      // Direct password match
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid Password" });
      }
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        branchid: (user.branch as any)?._id || null,
        branchName: (user.branch as any)?.name || null,
      };

      const token = generateToken(user);

      res.json({ token, userResponse });
    } catch (e) {
      next(e);
    }
  }
);


// ----------------------
// Assign role/permissions to staff
// ----------------------
// router.patch(
//   "/assign/:id",
//   // authenticate,
//   requireRole(["owner", "manager"]),
//   async (req: Request & { user?: IUser }, res: Response, next: NextFunction) => {
//     try {
//       const { id } = req.params;
//       const { role, permissions } = req.body;

//       const staff = await User.findById(id);
//       if (!staff) return res.status(404).json({ error: "User not found" });

//       if (staff.role !== "staff") {
//         return res
//           .status(400)
//           .json({ error: "Only staff can be assigned roles/permissions" });
//       }

//       if (req.user?.role === "manager" && role && role !== "staff") {
//         return res
//           .status(403)
//           .json({ error: "Manager cannot assign non-staff roles" });
//       }

//       if (role) staff.role = role;
//       if (Array.isArray(permissions)) staff.permissions = permissions;

//       await staff.save();

//       res.json({ message: "Staff updated", staff });
//     } catch (e) {
//       next(e);
//     }
//   }
// );

// ----------------------
// Profiles
// ----------------------
router.get(
  "/profiles",
  // authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = req.query.branch as string;
      if (!branchId) {
        return res.status(400).json({ error: "Branch ID is required" });
      }

      // Get all users of this branch
      const staff = await User.find({ branch: branchId })
        .select("-password -__v") // hide sensitive fields
        .populate("branch", "name PIN phone") // get branch details
        .lean();

      res.json({ staff });
    } catch (e) {
      next(e);
    }
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
