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

// load swagger JSON at runtime (try dist first, fallback to project root)
let swaggerSpec: any;
try {
  swaggerSpec = require(path.join(__dirname, "swagger-output.json"));
} catch (e) {
  // running locally (src), fall back to project root
  swaggerSpec = require(path.join(process.cwd(), "swagger-output.json"));
}

// Express app
const app = express();

// Helmet + CSP as before (optional adjust)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"]
      }
    }
  })
);

// CORS
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.use(express.json());

// serve docs-assets:
// - in production, static files were copied to dist/docs-assets
// - in dev, serve directly from swagger-ui-dist so you don't need to copy manually
let docsAssetsPath: string;
if (process.env.NODE_ENV === "production") {
  docsAssetsPath = path.join(__dirname, "docs-assets"); // dist/docs-assets
} else {
  // dev: serve straight from node_modules
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerUiDist = require("swagger-ui-dist");
  docsAssetsPath = swaggerUiDist.getAbsoluteFSPath();
}
app.use("/docs-assets", express.static(docsAssetsPath, { maxAge: "1d" }));

// Expose the swagger JSON to the browser as /api/swagger.json
app.get("/api/swagger.json", (req, res) => {
  const deployedUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const specWithServer = {
    ...swaggerSpec,
    servers: [{ url: deployedUrl, description: "Deployed API" }],
  };
  res.json(specWithServer);
});

// Your existing API routes
app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);
app.use("/api/orderv2", orderv2s);
app.use("/api/menu", menu);
app.use("/api/table", table);
app.use("/api/ingredients", ingredients);

// Optional: local convenience route to redirect /docs -> static index (if not handled by vercel routes)
app.get("/docs", (req, res) => {
  // If running in production, Vercel serves dist/docs/index.html directly (see vercel.json).
  // For local dev, just return a generated HTML that uses /docs-assets.
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, "docs", "index.html"));
  } else {
    // generate the tiny HTML (same as dist/docs/index.html)
    res.send(`
      <!doctype html><html><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Orderease API Docs</title>
        <link rel="stylesheet" href="/docs-assets/swagger-ui.css">
        <style>
          .swagger-ui { background:#0b0b0d; color:#e6eef6; }
          .swagger-ui .topbar { background:#0f1720 !important; box-shadow:none !important; }
        </style>
      </head><body><div id="swagger-ui"></div>
      <script src="/docs-assets/swagger-ui-bundle.js"></script>
      <script src="/docs-assets/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          SwaggerUIBundle({
            url: "/api/swagger.json",
            dom_id: "#swagger-ui",
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "StandaloneLayout",
            deepLinking: true
          });
        };
      </script></body></html>
    `);
  }
});

// normal root
app.get("/", (req, res) => res.send("Payment engine is Running"));

// DB + start
mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log("Connected to database!");
  app.listen(process.env.PORT, () => {
    console.log("Server listening on", process.env.PORT);
  });
}).catch(err => console.error("DB connect fail", err));
