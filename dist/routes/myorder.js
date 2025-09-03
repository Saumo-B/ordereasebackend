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
// GET /api/myorders?phone=1234567890   (will auto-convert to +911234567890)
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" });
        }
        // Convert to string and normalize
        phone = String(phone).trim();
        // // If it doesn't already start with +91, add it
        // if (!phone.startsWith("+91")) {
        phone = "+91" + phone;
        // }
        const orders = yield Order_1.Order.find({ "customer.phone": phone })
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