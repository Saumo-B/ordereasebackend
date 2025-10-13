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
    manualOutOfStock: { type: Boolean, default: false },
    outOfStock: { type: Boolean, default: false },
    category: { type: String },
    description: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String, ref: "Tag" }],
    branch: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Branch", required: true },
    // Base recipe for the menu item (applies to all variants unless overridden)
    recipe: [{
            ingredient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Ingredient", required: true },
            qtyRequired: { type: Number, required: true }, // Quantity needed per 1 unit of this menu item
        }],
    // Optional variants array with specific variant data
    variants: [{
            variantName: { type: String, required: true }, // Variant name, e.g., 'Small', 'Large', 'Vegan'
            price: { type: Number, required: true }, // Price for this variant
            // description: { type: String },                  // Optional description for the variant/
            manualOutOfStock: { type: Boolean, default: false },
            outOfStock: { type: Boolean, default: false }, // Whether the variant is out of stock
            imageUrl: { type: String }, // Optional image URL specific to the variant
            tags: [{ type: String, ref: "Tag" }], // Optional tags for the variant
            recipe: [{
                    ingredient: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Ingredient", required: true },
                    qtyRequired: { type: Number, required: true }, // Quantity needed for this variant
                }]
        }]
}, { timestamps: true });
// Create and export the MenuItem model
exports.MenuItem = mongoose_1.default.model("MenuItem", MenuItemSchema);
//# sourceMappingURL=Menu.js.map