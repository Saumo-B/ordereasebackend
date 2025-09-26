"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MenuItemSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    outOfStock: { type: Boolean, default: false },
    category: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    branch: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Branch", required: true },
    // recipe: list of ingredient + required qty
    recipe: [{
            ingredient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Ingredient", required: true },
            qtyRequired: { type: Number, required: true }, // how much needed per 1 unit of this menu item
        }]
}, { timestamps: true });
exports.MenuItem = mongoose_1.default.model("MenuItem", MenuItemSchema);
//# sourceMappingURL=Menu.js.map