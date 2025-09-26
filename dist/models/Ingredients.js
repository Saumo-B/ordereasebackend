"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ingredient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const IngredientSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 }, // actual stock
    branch: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Branch", required: true, immutable: true }, // 🔹 branch required
    reservedQuantity: { type: Number, default: 0 }, // reserved for unpaid orders
    lowStockThreshold: { type: Number, default: 0 }, // user-defined warning threshold
}, { timestamps: true });
exports.Ingredient = mongoose_1.default.model("Ingredient", IngredientSchema);
//# sourceMappingURL=Ingredients.js.map