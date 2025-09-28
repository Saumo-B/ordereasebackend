import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IUser } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

const JWT_SECRET = process.env.JWT_SECRET || "changeme"; // move to .env

//  Authentication middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log(" authenticate middleware called");
  try {
    const authHeader = req.headers["authorization"];
    console.log("Auth header:", req.headers["authorization"]);
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted token:", token);
    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    // verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id: string };
    console.log("Decoded JWT: ", decoded)
    // fetch user
    const user = await User.findById(decoded.id);
    console.log("Fetched user:", user?.email || "not found");
    if (!user) {
      return res.status(401).json({ error: "Invalid token user" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

//  Generate JWT helper
export const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" } // adjust as needed
  );
};
