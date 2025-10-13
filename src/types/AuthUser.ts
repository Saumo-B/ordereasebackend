import { Types } from "mongoose";

export interface AuthUser {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  role: string;
  branch: any;
  permissions: string[];
  isSuper?: boolean;
}
