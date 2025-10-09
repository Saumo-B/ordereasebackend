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
const Order_1 = require("../models/Order");
const router = (0, express_1.Router)();
// GET /api/myorder?phone=1234567890&branch=670e5c3b85a2b456ea94d2c8
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { phone, branch } = req.query;
        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }
        // Normalize phone number
        // phone = String(phone).trim();
        // if (!phone.startsWith("+91")) {
        //   phone = "+91" + phone;
        // }
        // Build filter
        const filter = { "customer.phone": phone };
        if (branch)
            filter.branch = branch;
        // Fetch recent orders
        const orders = yield Order_1.Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(5);
        if (!orders.length) {
            return res.status(404).json({ message: "No orders found for this phone number" });
        }
        res.json({ orders });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
//# sourceMappingURL=myorder.js.map