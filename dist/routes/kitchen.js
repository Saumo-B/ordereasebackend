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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
require("dotenv/config");
const Order_1 = require("../models/Order");
const router = (0, express_1.Router)();
// Get all orders for today
router.get("/today", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const orders = yield Order_1.Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
            .sort({ createdAt: -1 })
            .lean();
        return res.json({
            count: orders.length,
            orders,
        });
    }
    catch (e) {
        console.error("Fetch today's orders error:", e);
        next(e);
    }
}));
// PATCH /api/kitchen/status/:orderId
router.patch("/status/:orderId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "Order ID is required" });
        }
        if (!status) {
            return res.status(400).json({ error: "Status is required in request body" });
        }
        // validate allowed statuses
        const allowedStatuses = ["created", "paid", "done", "failed", "served"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }
        if (status === "paid") {
            const order = yield Order_1.Order.findByIdAndUpdate(orderId, { status }, { new: true });
            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.served) {
                order.status = "done";
                yield order.save();
                res.json({
                    message: `Order Completed`,
                    order,
                });
            }
            res.json({
                message: `Order status updated to ${status}`,
                order,
            });
        }
        if (status === "served") {
            const order = yield Order_1.Order.findByIdAndUpdate(orderId, { served: true }, { new: true });
            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }
            if (order.status === "paid") {
                order.status = "done";
                yield order.save();
                res.json({
                    message: `Order Completed`,
                    order,
                });
            }
            res.json({
                message: `Order is Served`,
                order,
            });
        }
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=kitchen.js.map