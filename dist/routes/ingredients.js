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
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Ingredients_1 = require("../models/Ingredients");
const router = (0, express_1.Router)();
// Create ingredient
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, quantity, unit } = req.body;
        if (!name || !unit) {
            return res.status(400).json({ error: "Name and unit are required" });
        }
        const ingredient = yield Ingredients_1.Ingredient.create({
            name,
            unit,
            quantity: quantity || 0,
        });
        res.status(201).json({ message: "Ingredient created", ingredient });
    }
    catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ error: "Ingredient name already exists" });
        }
        next(e);
    }
}));
// Get all ingredients
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ingredients = yield Ingredients_1.Ingredient.find().lean();
        res.json(ingredients);
    }
    catch (e) {
        next(e);
    }
}));
// Get ingredient by ID
router.get("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const ingredient = yield Ingredients_1.Ingredient.findById(id).lean();
        if (!ingredient)
            return res.status(404).json({ error: "Not found" });
        res.json(ingredient);
    }
    catch (e) {
        next(e);
    }
}));
// Update ingredient (change name/unit/quantity)
router.patch("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, quantity, unit } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const ingredient = yield Ingredients_1.Ingredient.findById(id);
        if (!ingredient)
            return res.status(404).json({ error: "Not found" });
        if (name)
            ingredient.name = name;
        if (unit)
            ingredient.unit = unit;
        if (typeof quantity === "number")
            ingredient.quantity = quantity; // override quantity
        yield ingredient.save();
        res.json({ message: "Ingredient updated", ingredient });
    }
    catch (e) {
        next(e);
    }
}));
// Delete ingredient
router.delete("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        const deleted = yield Ingredients_1.Ingredient.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ error: "Not found" });
        res.json({ message: "Ingredient deleted", ingredient: deleted });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
//# sourceMappingURL=ingredients.js.map