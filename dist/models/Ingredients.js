"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ingredient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const IngredientSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: true },
    unit: { type: String, required: true }, // e.g., "kg", "g", "litre", "pcs"
    quantity: { type: Number, required: true, default: 0 }, // current stock
}, { timestamps: true });
exports.Ingredient = mongoose_1.default.model("Ingredient", IngredientSchema);
//# sourceMappingURL=Ingredients.js.map