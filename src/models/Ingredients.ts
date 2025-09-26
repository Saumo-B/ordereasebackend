import mongoose from "mongoose";

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true }, 
  quantity: { type: Number, required: true, default: 0 }, // actual stock
  reservedQuantity: { type: Number, default: 0 }, // reserved for unpaid orders
  lowStockThreshold: { type: Number, default: 0 }, // user-defined warning threshold
}, { timestamps: true });

export const Ingredient = mongoose.model("Ingredient", IngredientSchema);
