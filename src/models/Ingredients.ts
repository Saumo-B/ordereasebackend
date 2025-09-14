import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true }, // e.g., "kg", "g", "litre", "pcs"
  quantity: { type: Number, required: true, default: 0 }, // current stock
}, { timestamps: true });

export const Ingredient = mongoose.model("Ingredient", IngredientSchema);
