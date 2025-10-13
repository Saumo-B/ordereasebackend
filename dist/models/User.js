"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const rolePermissions_1 = require("../lib/rolePermissions");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    branch: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Branch", required: true },
    role: {
        type: String,
        enum: ["owner", "manager", "chef", "waiter", "dev"],
        default: "waiter",
    },
    permissions: {
        type: [String],
        default: [],
    },
}, { timestamps: true });
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
    const user = this;
    // Only assign default permissions if none are set yet
    if (!user.permissions || user.permissions.length === 0) {
        user.permissions = [...(rolePermissions_1.ROLE_DEFAULT_PERMISSIONS[user.role] || [])];
    }
    next();
});
exports.User = mongoose_1.default.model("User", UserSchema);
//# sourceMappingURL=User.js.map