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
const inventoryService_1 = require("../lib/inventoryService");
const Order_1 = require("../models/Order");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const router = (0, express_1.Router)();
const TZ = "Asia/Kolkata"; // Force IST
// Get all orders for today (IST)
router.get("/today", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startOfDay = (0, dayjs_1.default)().tz(TZ).startOf("day").toDate();
        const endOfDay = (0, dayjs_1.default)().tz(TZ).endOf("day").toDate();
        const orders = yield Order_1.Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
            .sort({ createdAt: -1 })
            .populate("lineItems.menuItem", "name") // only fetch menuItem name
            .lean();
        // Transform: replace menuItem with its name
        const transformed = orders.map(order => (Object.assign(Object.assign({}, order), { lineItems: order.lineItems.map((li) => {
                var _a;
                return ({
                    qty: li.qty,
                    price: li.price,
                    name: ((_a = li.menuItem) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                });
            }) })));
        return res.json({
            count: transformed.length,
            orders: transformed,
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
        if (!status) {
            return res.status(400).json({ error: "Status is required in request body" });
        }
        const allowedStatuses = ["created", "paid", "done", "failed", "served"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }
        // --- Handle "paid" with atomic update
        if (status === "paid") {
            const order = yield Order_1.Order.findOneAndUpdate({ _id: orderId, status: { $ne: "paid" } }, // only update if NOT already paid
            { $set: { status: "paid" } }, { new: true });
            if (!order) {
                return res.status(409).json({ message: "Order already Paid" });
            }
            try {
                yield (0, inventoryService_1.deductInventory)(orderId);
            }
            catch (err) {
                return res.status(400).json({ error: err instanceof Error ? err.message : "Inventory error" });
            }
            // If already served, mark done
            if (order.served) {
                order.status = "done";
                yield order.save();
                return res.json({ message: "Order Completed", order });
            }
            return res.json({ message: "Order status updated to paid", order });
        }
        // --- Handle "served" (atomic as well)
        if (status === "served") {
            const order = yield Order_1.Order.findById(orderId);
            if (!order)
                return res.status(404).json({ error: "Order not found" });
            order.served = true;
            if (order.status === "paid")
                order.status = "done";
            yield order.save();
            return res.json({
                message: order.status === "done" ? "Order Completed" : "Order is Served",
                order,
            });
        }
        // --- Other statuses
        const order = yield Order_1.Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        return res.json({ message: `Order status updated to ${status}`, order });
    }
    catch (err) {
        next(err);
    }
}));
// 📊 GET /api/kitchen/dashboard-stats (IST-based)
router.get("/dashboard-stats", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const startOfDay = (0, dayjs_1.default)().tz(TZ).startOf("day").toDate();
        const endOfDay = (0, dayjs_1.default)().tz(TZ).endOf("day").toDate();
        const todayOrders = yield Order_1.Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
        }).populate("lineItems.menuItem");
        if (!todayOrders.length) {
            return res.json({
                todayStats: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
                salesByHour: [],
                topSellingItems: [],
                orderStatusCounts: [],
            });
        }
        // ---- Today stats
        const paidOrders = todayOrders.filter(o => ["paid", "done"].includes(o.status));
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalOrders = todayOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        // ---- Sales by hour
        const salesByHourMap = {};
        for (const order of paidOrders) {
            const hour = (0, dayjs_1.default)(order.createdAt).tz(TZ).hour();
            const label = hour === 0 ? "12am" :
                hour < 12 ? `${hour}am` :
                    hour === 12 ? "12pm" : `${hour - 12}pm`;
            salesByHourMap[label] = (salesByHourMap[label] || 0) + (order.amount || 0);
        }
        const salesByHour = Object.entries(salesByHourMap).map(([hour, revenue]) => ({
            hour,
            revenue,
        }));
        // ---- Top selling items
        const itemCount = {};
        for (const order of todayOrders) {
            for (const item of order.lineItems) {
                const name = ((_a = item.menuItem) === null || _a === void 0 ? void 0 : _a.name) || "Unknown Item";
                itemCount[name] = (itemCount[name] || 0) + item.qty;
            }
        }
        const topSellingItems = Object.entries(itemCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        // ---- Order status counts
        const statusCount = {};
        for (const order of todayOrders) {
            statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        }
        const orderStatusCounts = Object.entries(statusCount).map(([status, count]) => ({
            status,
            count,
        }));
        return res.json({
            todayStats: {
                totalRevenue,
                totalOrders,
                averageOrderValue: Number(averageOrderValue.toFixed(2)),
            },
            salesByHour,
            topSellingItems,
            orderStatusCounts,
        });
    }
    catch (e) {
        console.error("Dashboard stats error:", e);
        next(e);
    }
}));
router.get("/sales-report", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "startDate and endDate are required (YYYY-MM-DD)" });
        }
        const start = (0, dayjs_1.default)(startDate).startOf("day").toDate();
        const end = (0, dayjs_1.default)(endDate).endOf("day").toDate();
        // Fetch orders in range
        const orders = yield Order_1.Order.find({
            createdAt: { $gte: start, $lte: end },
            status: { $in: ["paid", "done"] }, // only count successful orders
        })
            .sort({ createdAt: 1 })
            .lean();
        if (!orders.length) {
            return res.json({
                summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
                salesTrend: [],
                orders: [],
            });
        }
        // ---- Summary
        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalRevenue / totalOrders;
        // ---- Sales trend (group by date)
        const trendMap = {};
        for (const order of orders) {
            const date = (0, dayjs_1.default)(order.createdAt).format("YYYY-MM-DD");
            trendMap[date] = (trendMap[date] || 0) + (order.amount || 0);
        }
        const salesTrend = Object.entries(trendMap).map(([date, revenue]) => ({
            date,
            revenue,
        }));
        // ---- Response
        return res.json({
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue: Number(averageOrderValue.toFixed(2)),
            },
            salesTrend,
            orders: orders.map(o => ({
                _id: o._id,
                orderToken: o.orderToken,
                customer: o.customer,
                amount: o.amount,
                status: o.status,
                createdAt: o.createdAt,
            })),
        });
    }
    catch (err) {
        console.error("Sales report error:", err);
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=kitchen.js.map