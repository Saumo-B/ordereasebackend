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
const token_1 = require("../lib/token");
// import mongoose from "mongoose";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest} from "pg-sdk-node";
const router = (0, express_1.Router)();
// Create order
router.post("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { items = [], customer } = req.body || {};
        const amount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
        const amountDue = amount;
        const orderToken = yield (0, token_1.makeToken)();
        const order = yield Order_1.Order.create({
            status: "created",
            amount,
            currency: "INR",
            lineItems: items,
            customer,
            orderToken,
            amountDue,
        });
        return res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            token: order.orderToken,
        });
    }
    catch (e) {
        return res.status(400).json({ error: ((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.message });
    }
}));
exports.default = router;
//# sourceMappingURL=orderv2.js.map