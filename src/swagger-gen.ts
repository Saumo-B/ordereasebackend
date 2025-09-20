    // import swaggerAutogen from "swagger-autogen";
    // import "dotenv/config";

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

    import swaggerAutogen from "swagger-autogen";
import "dotenv/config";

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

swaggerAutogen()(outputFile, endpointsFiles, doc).then(() => {
  console.log("Swagger JSON generated at public/swagger-output.json");
});
