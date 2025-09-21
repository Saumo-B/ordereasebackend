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
        const { items = [], customer } = req.body || {};
        if (!items.length) {
            return res.status(400).json({ error: "Order must have at least one item" });
        }
        const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        const orderToken = yield (0, token_1.makeToken)();
        // Build order (not saved yet)
        const newOrder = new Order_1.Order({
            status: "created",
            amount,
            currency: "INR",
            lineItems: items,
            customer,
            orderToken,
            paymentMethod: "counter",
        });
        // Reserve ingredients atomically
        yield (0, inventoryService_1.reserveInventory)(newOrder, session);
        // Save the order only after reservation succeeds
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
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            error: err instanceof Error ? err.message : "Failed to create order",
        });
    }
}));
exports.default = router;
//# sourceMappingURL=orderv2.js.map