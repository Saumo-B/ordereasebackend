import mongoose, { Types,Document, Schema } from "mongoose";
import { ROLE_DEFAULT_PERMISSIONS } from "../lib/rolePermissions";
import bcrypt from "bcryptjs";

export type UserRole = "owner" | "manager" | "chef" | "waiter";

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
      enum: ["owner", "manager", "chef", "waiter","dev"],
      default: "waiter",
    },
    permissions: {
      type: [String],
      default: [], 
    },
  },
  { timestamps: true }
);

//  Hash password before saving
// UserSchema.pre("save", async function (next) {
//   const user = this as IUser;
//   if (!user.isModified("password")) return next();
//   user.password = await bcrypt.hash(user.password, 10);
//   next();
// });

//  Compare password
// UserSchema.methods.comparePassword = function (
//   candidatePassword: string
// ): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };
// 🔹 Assign default permissions based on role when creating a new user
UserSchema.pre("save", function (next) {
  const user = this as IUser;

  // Only assign default permissions if none are set yet
  if (!user.permissions || user.permissions.length === 0) {
    user.permissions = [...(ROLE_DEFAULT_PERMISSIONS[user.role] || [])];
  }

  next();
});

export const User = mongoose.model<IUser>("User", UserSchema);


