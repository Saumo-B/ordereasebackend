import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { type: String },
  description: { type: String },
  imageUrl: { type: String },

  // recipe: list of ingredient + required qty
  recipe: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
    qtyRequired: { type: Number, required: true }, // how much needed per 1 unit of this menu item
  }]
}, { timestamps: true });

export const MenuItem = mongoose.model("MenuItem", MenuItemSchema);
