import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import orders from "./routes/order";
import kitchens from "./routes/kitchen";
import myorders from "./routes/myorder";
import orderv2s from "./routes/orderv2";
import menu from "./routes/menu";
import ingredients from "./routes/ingredients";
import table from "./routes/table"
import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger-output.json";

const customCss = `
body, .swagger-ui {
  background: #0b0b0d !important;
  color: #e6eef6 !important;
}
/* ... rest of your dark CSS ... */
.swagger-ui .scheme-container {
  background: #0f1720 !important;
  color: #e6eef6 !important;
  border: 1px solid #1f2937 !important;
}
`;

const app = express();
app.use(cors({
  origin: "*",  // or restrict to your frontend domain
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.get('/',(req,res)=> {
  return res.send('Payment engine is Running')
})
// app.get("/token", (req, res) =>{
//   try {
//     const token = makeToken();
//     res.json({token});
//   } catch (e) { next(e);}
// })
app.use(helmet());
app.use(cors()); // allow everything
//app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") || true }));
app.use(express.json()); // for normal routes (webhook route handles raw body itself)

app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);
app.use("/api/orderv2", orderv2s);
app.use("/api/menu", menu);
app.use("/api/table", table);
app.use("/api/ingredients", ingredients);


app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, {
  customCss,
  customSiteTitle: "Orderease API Docs (Dark)"
}));

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to database!");
    app.listen(process.env.PORT  , () => {
    console.log("Server listening on", process.env.PORT );
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });

