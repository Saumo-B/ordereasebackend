"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_autogen_1 = __importDefault(require("swagger-autogen"));
require("dotenv/config");
const doc = {
    info: {
        title: "Restaurant POS API",
        description: "API documentation"
    },
    host: process.env.BACKEND_HOST,
    schemes: ["https"]
};
const outputFile = "./swagger-output.json";
const endpointsFiles = ["./server.ts"];
(0, swagger_autogen_1.default)()(outputFile, endpointsFiles, doc);
//# sourceMappingURL=swagger-gen.js.map