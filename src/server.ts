import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

// import routes
import orders from "./routes/order";
import kitchens from "./routes/kitchen";
import myorders from "./routes/myorder";
import orderv2s from "./routes/orderv2";
import menu from "./routes/menu";
import ingredients from "./routes/ingredients";
import table from "./routes/table";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// API routes
app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);
app.use("/api/orderv2", orderv2s);
app.use("/api/menu", menu);
app.use("/api/table", table);
app.use("/api/ingredients", ingredients);

// serve swagger JSON
app.get("/api/swagger.json", (req, res) => {
  res.sendFile(path.join(__dirname, "../swagger-output.json"));
});

// Serve Swagger UI assets
app.use("/api/docs-assets", express.static(path.join(__dirname, "docs-assets")));

// Serve Swagger UI page
app.get("/api/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "swagger-output.json"));
});

app.get("/", (req, res) => res.send("API Running"));

mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log("Connected to database");
  app.listen(process.env.PORT, () => console.log("Server listening on", process.env.PORT));
}).catch(err => console.log("DB connection failed", err));
