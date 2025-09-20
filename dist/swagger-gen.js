"use strict";
// import swaggerAutogen from "swagger-autogen";
// import "dotenv/config";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const doc = {
// info: {
//     title: "Restaurant POS API",
//     description: "API documentation"
// },
// host: process.env.BACKEND_HOST,
// schemes: ["https"]
// };
// const outputFile = "./swagger-output.json";
// const endpointsFiles = ["./server.ts"];
// swaggerAutogen()(outputFile, endpointsFiles, doc);
const swagger_autogen_1 = __importDefault(require("swagger-autogen"));
require("dotenv/config");
const doc = {
    info: {
        title: "Orderease API",
        description: "API documentation"
    },
    host: process.env.BACKEND_HOST || "localhost:3000",
    schemes: ["https"],
    tags: [
        { name: "Orders", description: "Order management APIs" },
        { name: "Kitchen", description: "Kitchen operations APIs" },
        { name: "My Orders", description: "User-specific order APIs" },
        { name: "Order V2", description: "Second version of order APIs" },
        { name: "Menu", description: "Menu management APIs" },
        { name: "Table", description: "Restaurant table APIs" },
        { name: "Ingredients", description: "Ingredient management APIs" },
    ],
};
const outputFile = "./public/swagger-output.json"; // must be in public
const endpointsFiles = ["./src/server.ts"];
(0, swagger_autogen_1.default)()(outputFile, endpointsFiles, doc).then(() => {
    console.log("Swagger JSON generated at public/swagger-output.json");
});
//# sourceMappingURL=swagger-gen.js.map