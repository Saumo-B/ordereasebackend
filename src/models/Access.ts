import mongoose, { Schema, Document } from "mongoose";

// Define the schema for the access control settings for each section
interface IAccessControl extends Document {
  orders: {
    type: boolean;
    branchSelector: boolean;
  };
  dashboard: {
    type: boolean;
    branchSelector: boolean;
  };
  salesReport: boolean;
  inventory: {
    type: boolean;
    branchSelector: boolean;
  };
  menu: {
    type: boolean;
    branchSelector: boolean;
  };
  roles: boolean;
  branches: boolean;
}

const AccessControlSchema = new Schema<IAccessControl>({
  orders: {
    type: {
      type: Boolean,
      default: true,
    },
    branchSelector: {
      type: Boolean,
      default: false,
    },
  },
  dashboard: {
    type: {
      type: Boolean,
      default: true,
    },
    branchSelector: {
      type: Boolean,
      default: false,
    },
  },
  salesReport: { type: Boolean, default: false },
  inventory: {
    type: {
      type: Boolean,
      default: false,
    },
    branchSelector: {
      type: Boolean,
      default: false,
    },
  },
  menu: {
    type: {
      type: Boolean,
      default: true,
    },
    branchSelector: {
      type: Boolean,
      default: false,
    },
  },
  roles: { type: Boolean, default: false },
  branches: { type: Boolean, default: false },
}, { timestamps: true });

// Define the model
export const AccessControl = mongoose.model<IAccessControl>("AccessControl", AccessControlSchema);


