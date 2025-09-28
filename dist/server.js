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
const auth_1 = require("./middleware/auth");
const role_1 = require("./middleware/role");
const order_1 = __importDefault(require("./routes/order"));
const kitchen_1 = __importDefault(require("./routes/kitchen"));
const myorder_1 = __importDefault(require("./routes/myorder"));
const orderv2_1 = __importDefault(require("./routes/orderv2"));
const menu_1 = __importDefault(require("./routes/menu"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const table_1 = __importDefault(require("./routes/table"));
const userAuth_1 = __importDefault(require("./routes/userAuth"));
const branch_1 = __importDefault(require("./routes/branch"));
const ai_1 = __importDefault(require("./routes/ai"));
const app = (0, express_1.default)();
// Helmet and relaxed CSP
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false
}));
const unless = (pathPatterns, middleware) => {
    return (req, res, next) => {
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
// Global CORS
// Allow specific frontend origin
const allowedOrigins = process.env.FRONTEND_ORIGIN;
console.log("Allowed:", allowedOrigins);
app.use((0, cors_1.default)({
    // origin: (origin, callback) => {
    //   if (!origin || allowedOrigins?.includes(origin)) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
// Apply globally, but skip login/register/menu GET
app.use(unless([
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
], auth_1.authenticate));
// app.use(authenticate);   // populate req.user
app.use(unless([
    /^\/api\/login/,
    // /^\/api\/register/,
    /^\/api\/docs/,
    /^\/docs-assets/,
    /^\/api\/swagger.json/,
    /^\/$/,
], role_1.autoPermission));
// app.use(autoPermission); // enforce from central map
// API routes
app.use("/api/orders", order_1.default);
app.use("/api/kitchen", kitchen_1.default);
app.use("/api/myorder", myorder_1.default);
app.use("/api/orderv2", orderv2_1.default);
app.use("/api/menu", menu_1.default);
app.use("/api/table", table_1.default);
app.use("/api/ingredients", ingredients_1.default);
app.use("/api/", userAuth_1.default);
app.use("/api/branch", branch_1.default);
app.use("/api/ai", ai_1.default);
// Serve Swagger UI static files
app.use("/docs-assets", express_1.default.static(path_1.default.join(__dirname, "docs-assets")));
app.use("/api/docs", express_1.default.static(path_1.default.join(__dirname, "docs")));
// Serve swagger JSON
app.get("/api/swagger.json", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "swagger-output.json"));
});
app.get("/ping", auth_1.authenticate, (req, res) => {
    res.json({ message: "pong" });
});
// Root
app.get("/", (req, res) => res.status(200).json({ STATUS: "Payment engine is running" }));
// Start server
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log(`Mongo Connected`);
    app.listen(process.env.PORT, () => {
        console.log(`Server listening on port ${process.env.PORT}`);
        console.log("Allowed:", allowedOrigins);
    });
})
    .catch(err => console.log("DB connection failed", err));
//# sourceMappingURL=server.js.map