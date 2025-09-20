    import swaggerAutogen from "swagger-autogen";
    import "dotenv/config";

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
    swaggerAutogen()(outputFile, endpointsFiles, doc);

// import swaggerAutogen from "swagger-autogen";
// import "dotenv/config";

// const doc = {
//   info: {
//     title: "Orderease API",
//     description: "Restaurant POS API"
//   },
//   host: process.env.BACKEND_HOST,
//   schemes: ["https"],
//   tags: [
//     { name: "Orders", description: "Order management APIs" },
//     { name: "Kitchen", description: "Kitchen operations APIs" },
//     { name: "MyOrders", description: "User-specific order APIs" },
//     { name: "OrderV2", description: "Second version of order APIs" },
//     { name: "Menu", description: "Menu management APIs" },
//     { name: "Table", description: "Restaurant table APIs" },
//     { name: "Ingredients", description: "Ingredient management APIs" }
//   ]
// };

// const outputFile = "./swagger-output.json";
// const endpointsFiles = ["./src/server.ts"];

// swaggerAutogen()(outputFile, endpointsFiles, doc);
