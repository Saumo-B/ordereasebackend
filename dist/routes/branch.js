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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Branch_1 = require("../models/Branch");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ✅ Create Branch
router.post("/", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branch = new Branch_1.Branch(req.body);
        yield branch.save();
        res.status(201).json(branch);
    }
    catch (err) {
        next(err);
    }
}));
// ✅ Get All Branches
router.get("/", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branches = yield Branch_1.Branch.find().lean();
        res.json(branches);
    }
    catch (err) {
        next(err);
    }
}));
// ✅ Get Single Branch
router.get("/:id", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branch = yield Branch_1.Branch.findById(req.params.id).lean();
        if (!branch)
            return res.status(404).json({ message: "Branch not found" });
        res.json(branch);
    }
    catch (err) {
        next(err);
    }
}));
// ✅ Update Branch
router.put("/:id", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branch = yield Branch_1.Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch)
            return res.status(404).json({ message: "Branch not found" });
        res.json(branch);
    }
    catch (err) {
        next(err);
    }
}));
// ✅ Delete Branch
router.delete("/:id", auth_1.authenticate, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branch = yield Branch_1.Branch.findByIdAndDelete(req.params.id);
        if (!branch)
            return res.status(404).json({ message: "Branch not found" });
        res.json({ message: "Branch deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=branch.js.map