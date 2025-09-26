"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// --- LineItem schema ---
const LineItemSchema = new mongoose_1.default.Schema({
    menuItem: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    status: {
        active: { type: Number, default: 0 },
        served: { type: Number, default: 0 }
    },
    price: { type: Number, required: true }
});
// Virtual property for qty (active + served)
LineItemSchema.virtual('qty').get(function () {
    var _a, _b, _c, _d;
    return ((_b = (_a = this.status) === null || _a === void 0 ? void 0 : _a.active) !== null && _b !== void 0 ? _b : 0) + ((_d = (_c = this.status) === null || _c === void 0 ? void 0 : _c.served) !== null && _d !== void 0 ? _d : 0);
});
// Enable virtuals for JSON output
LineItemSchema.set('toJSON', { virtuals: true });
// --- Order schema ---
const OrderSchema = new mongoose_1.default.Schema({
    phonepeOrderId: { type: String, index: true },
    status: { type: String, enum: ["created", "paid", "done", "failed"], default: "created" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    served: { type: Boolean, default: false },
    lineItems: [LineItemSchema],
    customer: {
        name: String,
        phone: String
    },
    orderToken: { type: String },
    paymentMethod: {
        type: String,
        enum: ["paymentgateway", "counter"],
        required: true,
        immutable: true
    },
    branch: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Branch", required: true, immutable: true }, // 🔹 branch required
}, { timestamps: true });
// Enable virtuals for OrderSchema as well
OrderSchema.set('toJSON', { virtuals: true });
exports.Order = mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map