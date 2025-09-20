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

const app = express();

// Helmet and relaxed CSP
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// Global CORS
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);
app.use("/api/orderv2", orderv2s);
app.use("/api/menu", menu);
app.use("/api/table", table);
app.use("/api/ingredients", ingredients);

// Serve Swagger UI static files
app.use("/docs-assets", express.static(path.join(__dirname, "docs-assets")));
app.use("/api/docs", express.static(path.join(__dirname, "docs")));

// Serve Swagger JSON directly if needed
app.get("/api/swagger.json", (req, res) => {
  res.sendFile(path.join(__dirname, "swagger-output.json"));
});

// Root
app.get("/", (req, res) => res.send("Payment engine is running"));

// Start server
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.log("DB connection failed", err));
