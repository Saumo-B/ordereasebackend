import mongoose, { Types,Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "owner" | "manager" | "staff";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: string[]; 
  branch: Types.ObjectId;
  // comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      default: "staff",
    },
    permissions: {
      type: [String],
      default: [], // staff starts with empty permissions
    },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
// UserSchema.pre("save", async function (next) {
//   const user = this as IUser;
//   if (!user.isModified("password")) return next();
//   user.password = await bcrypt.hash(user.password, 10);
//   next();
// });

// 🔹 Compare password
// UserSchema.methods.comparePassword = function (
//   candidatePassword: string
// ): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };

export const User = mongoose.model<IUser>("User", UserSchema);
