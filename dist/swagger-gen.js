"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_autogen_1 = __importDefault(require("swagger-autogen"));
const doc = {
    info: {
        title: "Orderease API",
        description: "API documentation for Orderease backend",
        version: "1.0.0",
    },
    host: "ordereasebackend-ten.vercel.app",
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
const outputFile = "./src/swagger-output.json"; // will be generated
const endpointsFiles = [
    "./src/routes/order.ts",
    "./src/routes/kitchen.ts",
    "./src/routes/myorder.ts",
    "./src/routes/orderv2.ts",
    "./src/routes/menu.ts",
    "./src/routes/table.ts",
    "./src/routes/ingredients.ts",
];
(0, swagger_autogen_1.default)()(outputFile, endpointsFiles, doc);
//# sourceMappingURL=swagger-gen.js.map