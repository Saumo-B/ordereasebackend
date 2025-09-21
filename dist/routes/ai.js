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
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
// Local AI server URL
const LOCAL_AI_SERVER = process.env.LOCAL_AI_SERVER || "http://localhost:5005";
router.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prompt } = req.body;
        if (!prompt)
            return res.status(400).json({ error: "Prompt is required" });
        // Forward request to local AI server
        const response = yield axios_1.default.post(`${LOCAL_AI_SERVER}/chat`, { prompt });
        res.json(response.data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "AI server request failed" });
    }
}));
exports.default = router;
//# sourceMappingURL=ai.js.map