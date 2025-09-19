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
const order_1 = __importDefault(require("./routes/order"));
const kitchen_1 = __importDefault(require("./routes/kitchen"));
const myorder_1 = __importDefault(require("./routes/myorder"));
const orderv2_1 = __importDefault(require("./routes/orderv2"));
const menu_1 = __importDefault(require("./routes/menu"));
const ingredients_1 = __importDefault(require("./routes/ingredients"));
const table_1 = __importDefault(require("./routes/table"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_output_json_1 = __importDefault(require("./swagger-output.json"));
const customCss = `
body, .swagger-ui {
  background: #0b0b0d !important;
  color: #e6eef6 !important;
}
/* ... rest of your dark CSS ... */
.swagger-ui .scheme-container {
  background: #0f1720 !important;
  color: #e6eef6 !important;
  border: 1px solid #1f2937 !important;
}
`;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*", // or restrict to your frontend domain
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.get('/', (req, res) => {
    return res.send('Payment engine is Running');
});
// app.get("/token", (req, res) =>{
//   try {
//     const token = makeToken();
//     res.json({token});
//   } catch (e) { next(e);}
// })
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)()); // allow everything
//app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") || true }));
app.use(express_1.default.json()); // for normal routes (webhook route handles raw body itself)
app.use("/api/orders", order_1.default);
app.use("/api/kitchen", kitchen_1.default);
app.use("/api/myorder", myorder_1.default);
app.use("/api/orderv2", orderv2_1.default);
app.use("/api/menu", menu_1.default);
app.use("/api/table", table_1.default);
app.use("/api/ingredients", ingredients_1.default);
app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_output_json_1.default, {
    customCss,
    customSiteTitle: "Orderease API Docs (Dark)"
}));
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => {
    console.log("Connected to database!");
    app.listen(process.env.PORT, () => {
        console.log("Server listening on", process.env.PORT);
    });
})
    .catch(() => {
    console.log("Connection failed!");
});
//# sourceMappingURL=server.js.map