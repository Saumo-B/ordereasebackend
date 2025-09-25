"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "changeme"; // move to .env
//  Authentication middleware
// export const authenticate = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//       return res.status(401).json({ error: "Authorization header missing" });
//     }
//     const token = authHeader.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Token missing" });
//     }
//     // verify token
//     const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id: string };
//     // fetch user
//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(401).json({ error: "Invalid token user" });
//     }
//     req.user = user;
//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     return res.status(401).json({ error: "Unauthorized" });
//   }
// };
//  Generate JWT helper
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" } // adjust as needed
    );
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map