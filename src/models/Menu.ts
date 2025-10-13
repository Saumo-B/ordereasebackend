import mongoose, { Document, Types } from "mongoose";

// Interface for ingredients and their required quantities in recipes
export interface IRecipe {
  ingredient: mongoose.Types.ObjectId;
  qtyRequired: number;
}

// Interface for a variant of a menu item
export interface IVariant {
  variantName: string;       // e.g., 'Small', 'Large', 'Spicy'
  price: number;             // Price for this variant
  // description?: string;      // Optional description for the variant
  manualOutofStock?: boolean;
  outOfStock?: boolean;      // Whether the variant is out of stock
  imageUrl?: string;         // Optional image URL specific to this variant
  tags?: string[];           // Optional tags for this variant
  recipe?: IRecipe[];        // Recipe for this variant (can differ from base menu item)
}

// Interface for the main MenuItem document
export interface IMenuItem extends Document {
  name: string;
  price: number;                             // Default price for the base item (if no variant is selected)
  manualOutOfStock: boolean;                 // If true, manually set as out of stock
  outOfStock: boolean;                       // Automatically set based on stock or manual setting
  category: string;
  tags: string[];
  branch: Types.ObjectId;
  description: string;
  imageUrl: string;
  recipe: IRecipe[];                         // Recipe for the base item (can be different for variants)
  variants?: IVariant[];                     // Optional variants (may or may not be present)
}

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  manualOutOfStock: { type: Boolean, default: false },
  outOfStock: { type: Boolean, default: false },
  category: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  tags: [{ type: String, ref: "Tag" }],
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  // Base recipe for the menu item (applies to all variants unless overridden)
  recipe: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
    qtyRequired: { type: Number, required: true }, // Quantity needed per 1 unit of this menu item
  }],
  // Optional variants array with specific variant data
  variants: [{
    variantName: { type: String, required: true },  // Variant name, e.g., 'Small', 'Large', 'Vegan'
    price: { type: Number, required: true },        // Price for this variant
    // description: { type: String },                  // Optional description for the variant/
    manualOutOfStock: { type: Boolean, default: false },
    outOfStock: { type: Boolean, default: false },  // Whether the variant is out of stock
    imageUrl: { type: String },                     // Optional image URL specific to the variant
    tags: [{ type: String, ref: "Tag" }],           // Optional tags for the variant
    recipe: [{
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
      qtyRequired: { type: Number, required: true }, // Quantity needed for this variant
    }] 
  }]
}, { timestamps: true });

// Create and export the MenuItem model
export const MenuItem = mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
