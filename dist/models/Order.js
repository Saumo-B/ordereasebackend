"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LineItem = new mongoose_1.default.Schema({
    menuItem: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    served: { type: Boolean, default: false },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
});
const OrderSchema = new mongoose_1.default.Schema({
    phonepeOrderId: { type: String, index: true },
    status: { type: String, enum: ["created", "paid", "done", "failed"], default: "created" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    served: { type: Boolean, default: false },
    lineItems: [LineItem],
    customer: {
        name: String,
        phone: String
    },
    orderToken: { type: String },
}, { timestamps: true });
exports.Order = mongoose_1.default.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map