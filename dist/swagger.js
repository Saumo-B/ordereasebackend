"use strict";
// import swaggerAutogen from "swagger-autogen";
// import "dotenv/config";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const doc = {
//   info: {
//     title: "Restaurant POS API",
//     description: "API documentation"
//   },
//   host: process.env.BACKEND_HOST,
//   schemes: ["https"]
// };
// const outputFile = "./swagger-output.json";
// const endpointsFiles = ["./server.ts"];
// swaggerAutogen()(outputFile, endpointsFiles, doc);
const swagger_output_json_1 = __importDefault(require("./swagger-output.json"));
const deployedUrl = process.env.BACKEND_ORIGIN;
// Clone the swaggerFile and update the servers array
const swaggerSpec = Object.assign(Object.assign({}, swagger_output_json_1.default), { servers: [
        {
            url: deployedUrl,
            description: "Deployed API"
        }
    ] });
exports.default = swaggerSpec;
//# sourceMappingURL=swagger.js.map