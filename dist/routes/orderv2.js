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
const inventoryService_1 = require("../lib/inventoryService");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Create order
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { items = [], customer, branch } = req.body || {};
        // Calculate total
        const amount = items.reduce((sum, it) => sum + it.price * it.status.active, 0);
        const orderToken = yield (0, token_1.makeToken)(branch);
        // Build order object
        const newOrder = new Order_1.Order({
            status: "created",
            amount,
            currency: "INR",
            lineItems: items,
            customer,
            branch,
            orderToken,
            paymentMethod: "counter",
        });
        // Reserve inventory first
        yield (0, inventoryService_1.reserveInventory)(newOrder, session);
        // Save order after reservation succeeds
        const order = yield newOrder.save({ session });
        yield session.commitTransaction();
        session.endSession();
        return res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            token: order.orderToken,
        });
    }
    catch (e) {
        yield session.abortTransaction();
        session.endSession();
        console.error("Order creation failed:", e);
        return res.status(400).json({ error: e.message || "Order creation failed" });
    }
}));
exports.default = router;
//# sourceMappingURL=orderv2.js.map