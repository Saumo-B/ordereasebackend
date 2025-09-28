// import { IUser } from "../../models/User";

// declare global {
// declare  namespace Express {
//     interface Request {
//       user?: import("../../models/User").IUser;
//     }
//   }
// }

import { IUser } from "../../models/User"; // adjust path

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}
