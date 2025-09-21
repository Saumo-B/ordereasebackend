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
const Menu_1 = require("../models/Menu");
const inventoryService_1 = require("../lib/inventoryService");
const pg_sdk_node_1 = require("pg-sdk-node");
const mongoose_1 = __importDefault(require("mongoose"));
// type OrderDoc = mongoose.Document & {
//   lineItems: LineItem[];
//   status: "created" | "paid" | "done" | "failed";
//   served: boolean;
//   amount: number;
//   currency: string;      // <-- add this
//   orderToken: string;    // <-- add this
//   customer?: Customer;
//   createdAt?: Date;
//   updatedAt?: Date;
// };
const router = (0, express_1.Router)();
const client = pg_sdk_node_1.StandardCheckoutClient.getInstance(process.env.MERCHANT_ID, process.env.SALT_KEY, parseInt(process.env.SALT_INDEX), pg_sdk_node_1.Env.SANDBOX);
// Create order
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { items = [], customer } = req.body || {};
        // 🔹 Validate items
        for (const { menuItem, qty, price } of items) {
            if (!menuItem || !qty || !price) {
                return res.status(400).json({ error: "menuItem, qty and price are required" });
            }
            // Ensure menuItem exists
            const menuDoc = yield Menu_1.MenuItem.findById(menuItem);
            if (!menuDoc) {
                return res.status(400).json({ error: `MenuItem not found: ${menuItem}` });
            }
            if (qty <= 0) {
                return res.status(400).json({ error: `Invalid qty for ${menuDoc.name}` });
            }
            if (price <= 0) {
                return res.status(400).json({ error: `Invalid price for ${menuDoc.name}` });
            }
        }
        // 🔹 Calculate total
        const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        // 🔹 Create order
        const orderToken = yield (0, token_1.makeToken)();
        const order = yield Order_1.Order.create({
            status: "created",
            amount,
            currency: "INR",
            lineItems: items,
            customer,
            orderToken,
            paymentMethod: "paymentgateway",
        });
        try {
            yield (0, inventoryService_1.reserveInventory)(order); // checks availability & increments reservedQuantity
        }
        catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : "Not enough stock" });
        }
        // 🔹 Setup redirect URL for PhonePe
        const redirectUrl = `${process.env.BACKEND_ORIGIN}/api/orders/status?id=${order.id}`;
        const request = pg_sdk_node_1.StandardCheckoutPayRequest.builder()
            .merchantOrderId(orderToken)
            .amount(amount * 100) // paise
            .redirectUrl(redirectUrl)
            .build();
        const response = yield client.pay(request);
        return res.json({
            checkoutPageUrl: response.redirectUrl,
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
            return res.redirect(`${process.env.FRONTEND_ORIGIN}/order/${order._id}?history=replace`);
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
// router.put("/:id", async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { items = [], customer } = req.body;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
//     }
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: "No items provided" });
//     }
//     const order = await Order.findById(id);
//     if (!order) return res.status(404).json({ error: "Order not found" });
//     const wasPaid = order.status === "paid";
//     let newItemsTotal = 0;
//     // Merge items & compute newItemsTotal
//     for (const { sku, qty, price } of items) {
//       if (!sku || !Number.isFinite(qty) || qty <= 0) {
//         return res.status(400).json({ error: `Invalid qty for sku ${sku || "(missing)"}` });
//       }
//       const existing = order.lineItems.find((it: any) => it.sku === sku);
//       if (existing) {
//         existing.qty += qty;
//         newItemsTotal += qty * existing.price;        // use existing price
//       } else {
//         if (!Number.isFinite(price) || price <= 0) {
//           return res.status(400).json({ error: `Missing/invalid price for new sku ${sku}` });
//         }
//         order.lineItems.push({ sku, qty, price });    // store in paise
//         newItemsTotal += qty * price;
//       }
//     }
//     // Recalculate grand total
//     order.amount = order.lineItems.reduce((sum: number, it: any) => sum + it.qty * it.price, 0);
//     // Merge customer
//     if (customer) order.customer = { ...order.customer, ...customer };
//     // ✅ Correct amountDue logic
//     if (wasPaid) {
//       // order was fully paid, only new items are due
//       order.amountDue = newItemsTotal;
//       if (newItemsTotal > 0) order.status = "created"; // revert to unpaid if new dues exist
//     } else {
//       // order wasn't fully paid → add new items to current due
//       order.amountDue = (order.amountDue || 0) + newItemsTotal;
//     }
//     // Adding items means it can't stay served
//     if (order.served) order.served = false;
//     await order.save();
//     return res.json({ message: "Order updated successfully", order });
//   } catch (e) {
//     console.error("Order update error:", e);
//     next(e);
//   }
// });
// PATCH /api/orders/:id
// PATCH /orders/:id
router.patch("/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { items = [], customer } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid MongoDB ObjectId for order" });
        }
        // Fetch the order
        const order = yield Order_1.Order.findById(id);
        if (!order)
            return res.status(404).json({ error: "Order not found" });
        // Block updates if already paid
        if (order.status === "paid") {
            return res.status(400).json({ error: "Paid orders cannot be updated" });
        }
        // Validate new items
        for (const { menuItem, qty, price } of items) {
            if (!mongoose_1.default.Types.ObjectId.isValid(menuItem)) {
                return res.status(400).json({ error: `Invalid menuItem ID: ${menuItem}` });
            }
            const menuDoc = yield Menu_1.MenuItem.findById(menuItem);
            if (!menuDoc) {
                return res.status(400).json({ error: `MenuItem not found: ${menuItem}` });
            }
            if (!Number.isFinite(qty) || qty <= 0) {
                return res.status(400).json({ error: `Invalid qty for menuItem ${menuDoc.name}` });
            }
            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({ error: `Missing/invalid price for menuItem ${menuDoc.name}` });
            }
        }
        // Release inventory for old items
        yield (0, inventoryService_1.releaseInventory)(order.lineItems.map((it) => ({
            menuItem: it.menuItem,
            qty: it.qty,
        })));
        // Replace items
        order.lineItems = items.map((it) => ({
            menuItem: it.menuItem,
            qty: it.qty,
            price: it.price,
            served: it.served,
        })); // Properly cast to DocumentArray type
        // Reserve inventory for new items
        try {
            yield (0, inventoryService_1.reserveInventory)(order);
        }
        catch (err) {
            return res
                .status(400)
                .json({ error: err instanceof Error ? err.message : "Not enough stock" });
        }
        // Recalculate total
        order.amount = order.lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);
        // Merge customer info
        if (customer) {
            order.customer = Object.assign(Object.assign({}, order.customer), customer);
        }
        // Reset served flag if needed
        if (order.served)
            order.served = false;
        // Save changes
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
            // order: deletedOrder,
        });
    }
    catch (e) {
        console.error("Order delete error:", e);
        next(e);
    }
}));
exports.default = router;
//# sourceMappingURL=order.js.map