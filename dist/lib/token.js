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
exports.makeToken = makeToken;
const Order_1 = require("../models/Order");
function makeToken(branchId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Start of today (midnight)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        // Count today's orders for this branch
        const todayCount = yield Order_1.Order.countDocuments({
            branch: branchId, // Filter by branch
            createdAt: { $gte: startOfDay }
        });
        // Token = (count % 9999) + 1
        const tokenNumber = (todayCount % 9999) + 1;
        return tokenNumber.toString().padStart(4, "0"); // "0001" → "9999"
    });
}
//# sourceMappingURL=token.js.map