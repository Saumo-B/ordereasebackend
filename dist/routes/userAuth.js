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
// import { authenticate } from "../middleware/auth";
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
router.post("/register", 
// authenticate,
(req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = req.body;
        // if (!req.user) {
        //   return res.status(401).json({ error: "Unauthorized" });
        // }
        // if (req.user.role === "manager" && role !== "staff") {
        //   return res
        //     .status(403)
        //     .json({ error: "Manager can only create staff accounts" });
        // }
        const existing = yield User_1.User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }
        // const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User_1.User({
            name,
            email,
            password,
            role: role || "staff",
        });
        yield user.save();
        res.status(201).json({ message: "User registered" });
    }
    catch (e) {
        next(e);
    }
}));
// ----------------------
// Login
// ----------------------
router.post("/login", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password } = req.body;
        const user = yield User_1.User.findOne({ email });
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
            branch: user.branch,
            branchName: ((_a = user.branch) === null || _a === void 0 ? void 0 : _a.name) || null,
        };
        const token = generateToken(user);
        res.json({ token, user });
    }
    catch (e) {
        next(e);
    }
}));
// ----------------------
// Assign role/permissions to staff
// ----------------------
router.patch("/assign/:id", 
// authenticate,
(0, role_1.requireRole)(["owner", "manager"]), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { role, permissions } = req.body;
        const staff = yield User_1.User.findById(id);
        if (!staff)
            return res.status(404).json({ error: "User not found" });
        if (staff.role !== "staff") {
            return res
                .status(400)
                .json({ error: "Only staff can be assigned roles/permissions" });
        }
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "manager" && role && role !== "staff") {
            return res
                .status(403)
                .json({ error: "Manager cannot assign non-staff roles" });
        }
        if (role)
            staff.role = role;
        if (Array.isArray(permissions))
            staff.permissions = permissions;
        yield staff.save();
        res.json({ message: "Staff updated", staff });
    }
    catch (e) {
        next(e);
    }
}));
// ----------------------
// Profile
// ----------------------
router.get("/profile", 
// authenticate,
(req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ user: req.user });
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