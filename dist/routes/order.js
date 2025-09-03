"use strict";
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
router.post("/", async (req, res, next) => {
    var _a, _b;
    try {
        const { items = [], customer } = req.body || {};
        const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        const amountDue = amount;
        const orderToken = (0, token_1.makeToken)();
        const order = await Order_1.Order.create({
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
        const response = await client.pay(request);
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
});
// Get order status (by Mongo _id)
router.get("/status", async (req, res, next) => {
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
        const order = await Order_1.Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        if (!order.orderToken) {
            return res.status(400).json({ error: "Order token missing" });
        }
        // Call PhonePe with orderToken
        const response = await client.getOrderStatus(order.orderToken);
        const status = response.state; // COMPLETED, FAILED, etc.
        // Update order status in DB + redirect
        if (status === "COMPLETED") {
            order.status = "paid";
            await order.save();
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/order/${order._id}`);
        }
        else {
            order.status = "failed";
            await order.save();
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/failure`);
        }
    }
    catch (e) {
        console.error("Status check error:", e);
        next(e);
    }
});
router.get("/detail", async (req, res, next) => {
    try {
        const { id } = req.query;
        console.log("Incoming id:", id);
        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Order Id missing" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const order = await Order_1.Order.findById(new mongoose_1.default.Types.ObjectId(id)).lean();
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        return res.json(order);
    }
    catch (e) {
        console.error("Detail fetch error:", e);
        next(e);
    }
});
router.put("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
        }
        const { items = [], customer } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "No items provided" });
        }
        const order = await Order_1.Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        // Merge items into existing lineItems
        for (const newItem of items) {
            const existingItem = order.lineItems.find((it) => it.sku === newItem.sku);
            if (existingItem) {
                existingItem.qty += newItem.qty;
            }
            else {
                order.lineItems.push({
                    sku: newItem.sku,
                    qty: newItem.qty,
                    price: newItem.price, // store as paise
                });
            }
        }
        //  Recalculate total amount from lineItems
        order.amount = order.lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
        // ✅ Update customer info if provided
        if (customer) {
            order.customer = {
                ...order.customer,
                ...customer,
            };
        }
        if (order.status === "paid") {
            order.status = "created";
            order.amountDue = order.amount - order.amountDue;
        }
        if (order.served) {
            order.served = false;
        }
        await order.save();
        return res.json({
            message: "Order updated successfully",
            order,
        });
    }
    catch (e) {
        console.error("Order update error:", e);
        next(e);
    }
});
exports.default = router;
