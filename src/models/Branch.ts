import mongoose from "mongoose";

export interface IBranch extends Document {
  name: string;
  PIN?: string;
  phone?: string;
  address?: string;
}

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  PIN: String,
  phone: String,
  address: String,
});
export const Branch = mongoose.model<IBranch>("Branch", BranchSchema);

