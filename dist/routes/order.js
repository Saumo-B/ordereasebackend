"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
require("dotenv/config");
const Order_1 = require("../models/Order");
const token_1 = require("../lib/token");
const mongoose_1 = __importDefault(require("mongoose"));
const pg_sdk_node_1 = require("pg-sdk-node");
const router = (0, express_1.Router)();
const client = pg_sdk_node_1.StandardCheckoutClient.getInstance(process.env.MERCHANT_ID, process.env.SALT_KEY, parseInt(process.env.SALT_INDEX), pg_sdk_node_1.Env.SANDBOX);
// Create order
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { items = [], customer } = req.body || {};
        const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        const amountDue = amount;
        const orderToken = (0, token_1.makeToken)();
        const order = yield Order_1.Order.create({
            status: "created",
            amount,
            currency: "INR",
            lineItems: items,
            customer,
            orderToken,
            amountDue,
        });
        const redirectUrl = `${process.env.BACKEND_ORIGIN}/api/orders/status?id=${order.id}`;
        const request = pg_sdk_node_1.StandardCheckoutPayRequest.builder()
            .merchantOrderId(orderToken)
            .amount(amount * 100)
            .redirectUrl(redirectUrl)
            .build();
        const response = yield client.pay(request);
        return res.json({
            // id: order.id,
            // amount: order.amount,
            // currency: order.currency,
            // token: order.orderToken,
            checkoutPageUrl: response.redirectUrl // include PhonePe response
        });
    }
    catch (e) {
        console.error("PhonePe error:", ((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.message);
        return res.status(400).json({ error: ((_b = e.response) === null || _b === void 0 ? void 0 : _b.data) || e.message });
    }
}));
// Get order status (by Mongo _id)
router.get("/status", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        console.log("Incoming id:", id);
        if (!id || typeof id !== "string") {
            return res.status(400).send("Order Id missing");
        }
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        // Find order by MongoDB _id
        const order = yield Order_1.Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        if (!order.orderToken) {
            return res.status(400).json({ error: "Order token missing" });
        }
        // Call PhonePe with orderToken
        const response = yield client.getOrderStatus(order.orderToken);
        const status = response.state; // COMPLETED, FAILED, etc.
        // Update order status in DB + redirect
        if (status === "COMPLETED") {
            order.status = "paid";
            yield order.save();
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/order/${order._id}`);
        }
        else {
            order.status = "failed";
            yield order.save();
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/failure`);
        }
    }
    catch (e) {
        console.error("Status check error:", e);
        next(e);
    }
}));
router.get("/detail", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        console.log("Incoming id:", id);
        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Order Id missing" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const order = yield Order_1.Order.findById(new mongoose_1.default.Types.ObjectId(id)).lean();
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        return res.json(order);
    }
    catch (e) {
        console.error("Detail fetch error:", e);
        next(e);
    }
}));
router.put("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { items = [], customer } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items provided" });
        }
        const order = yield Order_1.Order.findById(id);
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        const wasPaid = order.status === "paid";
        let newItemsTotal = 0;
        // Merge items & compute newItemsTotal
        for (const { sku, qty, price } of items) {
            if (!sku || !Number.isFinite(qty) || qty <= 0) {
                return res.status(400).json({ error: `Invalid qty for sku ${sku || "(missing)"}` });
            }
            const existing = order.lineItems.find((it) => it.sku === sku);
            if (existing) {
                existing.qty += qty;
                newItemsTotal += qty * existing.price; // use existing price
            }
            else {
                if (!Number.isFinite(price) || price <= 0) {
                    return res.status(400).json({ error: `Missing/invalid price for new sku ${sku}` });
                }
                order.lineItems.push({ sku, qty, price }); // store in paise
                newItemsTotal += qty * price;
            }
        }
        // Recalculate grand total
        order.amount = order.lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
        // Merge customer
        if (customer)
            order.customer = Object.assign(Object.assign({}, order.customer), customer);
        // ✅ Correct amountDue logic
        if (wasPaid) {
            // order was fully paid, only new items are due
            order.amountDue = newItemsTotal;
            if (newItemsTotal > 0)
                order.status = "created"; // revert to unpaid if new dues exist
        }
        else {
            // order wasn't fully paid → add new items to current due
            order.amountDue = (order.amountDue || 0) + newItemsTotal;
        }
        // Adding items means it can't stay served
        if (order.served)
            order.served = false;
        yield order.save();
        return res.json({ message: "Order updated successfully", order });
    }
    catch (e) {
        console.error("Order update error:", e);
        next(e);
    }
}));
router.delete("/:orderId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const deletedOrder = yield Order_1.Order.findByIdAndDelete(orderId);
        if (!deletedOrder) {
            return res.status(404).json({ error: "Order not found" });
        }
        return res.json({
            message: "Order deleted successfully",
            order: deletedOrder,
        });
    }
    catch (e) {
        console.error("Order delete error:", e);
        next(e);
    }
}));
exports.default = router;
//# sourceMappingURL=order.js.map