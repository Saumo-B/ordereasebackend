"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
// import { PERMISSION } from "../lib/permission";
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
// Generate JWT
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
    });
};
// ----------------------
// Register User
// ----------------------
router.post("/register", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        const branchId = req.query.branch;
        if (!branchId) {
            return res.status(400).json({ error: "Branch ID is required in query param" });
        }
        // Check if email already exists
        const existing = yield User_1.User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }
        // TODO: Add hashing in production
        // const hashedPassword = await bcrypt.hash(password, 10);
        // Assign branch explicitly
        const user = new User_1.User({
            name,
            email,
            password,
            role: role || "staff",
            branch: branchId,
        });
        yield user.save();
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
    }
    catch (e) {
        next(e);
    }
}));
// ----------------------
// Login
// ----------------------
router.post("/login", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password } = req.body;
        const user = yield User_1.User.findOne({ email }).populate("branch", "name");
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
            branchid: ((_a = user.branch) === null || _a === void 0 ? void 0 : _a._id) || null,
            branchName: ((_b = user.branch) === null || _b === void 0 ? void 0 : _b.name) || null,
        };
        const token = generateToken(user);
        res.json({ token, userResponse });
    }
    catch (e) {
        next(e);
    }
}));
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
router.get("/profiles", 
// authenticate,
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branchId = req.query.branch;
        if (!branchId) {
            return res.status(400).json({ error: "Branch ID is required" });
        }
        // Get all users of this branch
        const staff = yield User_1.User.find({ branch: branchId })
            .select("-password -__v") // hide sensitive fields
            .populate("branch", "name PIN phone") // get branch details
            .lean();
        res.json({ staff });
    }
    catch (e) {
        next(e);
    }
}));
// ----------------------
// Delete User
// ----------------------
router.delete("/:id", 
// authenticate,
(0, role_1.requireRole)(["owner", "manager"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield User_1.User.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted", user: deleted });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
//# sourceMappingURL=userAuth.js.map