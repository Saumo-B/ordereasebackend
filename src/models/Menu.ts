import mongoose, { Document, Types } from "mongoose";

interface IRecipe {
  ingredient: mongoose.Types.ObjectId;
  qtyRequired: number;
}
interface IMenuItem extends Document {
  name: string;
  price: number;
  outOfStock: boolean;
  category: String,
  description: String,
  imageUrl: String,
  recipe: IRecipe[];
}
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  outOfStock: { type: Boolean, default: false },
  category: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  // recipe: list of ingredient + required qty
  recipe: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
    qtyRequired: { type: Number, required: true }, // how much needed per 1 unit of this menu item
  }]
}, { timestamps: true });

export const MenuItem = mongoose.model("MenuItem", MenuItemSchema);
