// import swaggerAutogen from "swagger-autogen";
// import "dotenv/config";

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

import swaggerFile from "./swagger-output.json";

const deployedUrl = process.env.BACKEND_ORIGIN;

// Clone the swaggerFile and update the servers array
const swaggerSpec = {
  ...swaggerFile,
  servers: [
    {
      url: deployedUrl,
      description: "Deployed API"
    }
  ]
};

export default swaggerSpec;
