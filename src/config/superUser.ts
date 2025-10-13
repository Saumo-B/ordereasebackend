import { PERMISSIONS } from "../lib/permission";

export const SUPER_USER = {
  _id: "000000000000000000000000",
  name: "dev@1",
  email: "dev@orderease.local",
  role: "dev",
  branch: null,
  permissions: Object.values(PERMISSIONS),
  isSuper: true,
};