import mongoose, { Document, Types } from "mongoose";

export interface IRecipe {
  ingredient: mongoose.Types.ObjectId;
  qtyRequired: number;
}
export interface IMenuItem extends Document {
  name: string;
  price: number;
  manualOutOfStock: { type: Boolean, default: false },
  outOfStock: boolean;
  category: String,
  tags: string[];
  branch:Types.ObjectId;
  description: String,
  imageUrl: String,
  recipe: IRecipe[];
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
  // recipe: list of ingredient + required qty
  recipe: [{
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
    qtyRequired: { type: Number, required: true }, // how much needed per 1 unit of this menu item
  }]
}, { timestamps: true });

export const MenuItem = mongoose.model<IMenuItem>("MenuItem", MenuItemSchema);
