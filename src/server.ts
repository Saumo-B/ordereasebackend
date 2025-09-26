import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

import orders from "./routes/order";
import kitchens from "./routes/kitchen";
import myorders from "./routes/myorder";
import orderv2s from "./routes/orderv2";
import menu from "./routes/menu";
import ingredients from "./routes/ingredients";
import table from "./routes/table";
import user from "./routes/userAuth";

import { authenticate } from "./middleware/auth";
import { autoPermission } from "./middleware/role";

import aiRouter from "./routes/ai";

const app = express();

// Helmet and relaxed CSP
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
const unless = (pathPatterns: RegExp[], middleware: any) => {
  return (req: any, res: any, next: any) => {
    if (pathPatterns.some(pattern => pattern.test(req.path))) {
      return next(); // skip auth
    }
    return middleware(req, res, next);
  };
};
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

// Apply globally, but skip login/register/menu GET
app.use(
  unless(
    [
      /^\/api\/login/,
      // /^\/api\/register/,
      /^\/api\/menu/,
      // /^\/api\/kitchen/,
      /^\/api\/myorder/,
      /^\/api\/orderv2/,
      /^\/api\/order/,
      // /^\/api\/ingredients/,
      /^\/api\/docs/,
      /^\/docs-assets/,
      /^\/api\/swagger.json/,
      /^\/$/, 
    ],
    authenticate
  )
);
// Global CORS
// Allow specific frontend origin
const allowedOrigins = [process.env.FRONTEND_ORIGIN];
console.log(allowedOrigins);
app.use(
  cors({
    // origin: (origin, callback) => {
    //   if (!origin || allowedOrigins.includes(origin)) {
        
    //     callback(null, true);
    //   } else {
        
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// app.use(authenticate);   // populate req.user
// app.use(autoPermission); // enforce from central map

// API routes
app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);
app.use("/api/orderv2", orderv2s);
app.use("/api/menu", menu);
app.use("/api/table", table);
app.use("/api/ingredients", ingredients);
app.use("/api/", user);

app.use("/api/ai", aiRouter);
// Serve Swagger UI static files
app.use("/docs-assets", express.static(path.join(__dirname, "docs-assets")));
app.use("/api/docs", express.static(path.join(__dirname, "docs")));

// Serve swagger JSON
app.get("/api/swagger.json", (req, res) => {
  res.sendFile(path.join(__dirname, "swagger-output.json"));
});


// Root
app.get("/", (req, res) => res.status(200).json({STATUS:"Payment engine is running"}));

// Start server
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log(`Mongo Connected`)
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
      console.log(allowedOrigins);
    });
  })
  .catch(err => console.log("DB connection failed", err));
