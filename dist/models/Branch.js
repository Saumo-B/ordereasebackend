"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branch = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BranchSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    PIN: String,
    phone: String,
    address: String,
});
exports.Branch = mongoose_1.default.model("Branch", BranchSchema);
//# sourceMappingURL=Branch.js.map