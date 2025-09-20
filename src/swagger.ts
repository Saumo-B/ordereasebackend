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
