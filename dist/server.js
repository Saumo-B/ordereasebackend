"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const order_1 = __importDefault(require("./routes/order"));
const kitchen_1 = __importDefault(require("./routes/kitchen"));
const myorder_1 = __importDefault(require("./routes/myorder"));
const orderv2_1 = __importDefault(require("./routes/orderv2"));
const menu_1 = __importDefault(require("./routes/menu"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const table_1 = __importDefault(require("./routes/table"));
// load swagger JSON at runtime (try dist first, fallback to project root)
let swaggerSpec;
try {
    swaggerSpec = require(path_1.default.join(__dirname, "swagger-output.json"));
}
catch (e) {
    // running locally (src), fall back to project root
    swaggerSpec = require(path_1.default.join(process.cwd(), "swagger-output.json"));
}
// Express app
const app = (0, express_1.default)();
// Helmet + CSP as before (optional adjust)
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"]
        }
    }
}));
// CORS
app.use((0, cors_1.default)({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express_1.default.json());
// serve docs-assets:
// - in production, static files were copied to dist/docs-assets
// - in dev, serve directly from swagger-ui-dist so you don't need to copy manually
let docsAssetsPath;
if (process.env.NODE_ENV === "production") {
    docsAssetsPath = path_1.default.join(__dirname, "docs-assets"); // dist/docs-assets
}
else {
    // dev: serve straight from node_modules
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const swaggerUiDist = require("swagger-ui-dist");
    docsAssetsPath = swaggerUiDist.getAbsoluteFSPath();
}
app.use("/docs-assets", express_1.default.static(docsAssetsPath, { maxAge: "1d" }));
// Expose the swagger JSON to the browser as /api/swagger.json
app.get("/api/swagger.json", (req, res) => {
    const deployedUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const specWithServer = Object.assign(Object.assign({}, swaggerSpec), { servers: [{ url: deployedUrl, description: "Deployed API" }] });
    res.json(specWithServer);
});
// Your existing API routes
app.use("/api/orders", order_1.default);
app.use("/api/kitchen", kitchen_1.default);
app.use("/api/myorder", myorder_1.default);
app.use("/api/orderv2", orderv2_1.default);
app.use("/api/menu", menu_1.default);
app.use("/api/table", table_1.default);
app.use("/api/ingredients", ingredients_1.default);
// Optional: local convenience route to redirect /docs -> static index (if not handled by vercel routes)
app.get("/docs", (req, res) => {
    // If running in production, Vercel serves dist/docs/index.html directly (see vercel.json).
    // For local dev, just return a generated HTML that uses /docs-assets.
    if (process.env.NODE_ENV === "production") {
        res.sendFile(path_1.default.join(__dirname, "docs", "index.html"));
    }
    else {
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
app.get('/favicon.ico', (req, res) => res.status(204));
app.get("/", (req, res) => res.send("Payment engine is Running"));
// DB + start
mongoose_1.default.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to database!");
    app.listen(process.env.PORT, () => {
        console.log("Server listening on", process.env.PORT);
    });
}).catch(err => console.error("DB connect fail", err));
//# sourceMappingURL=server.js.map