import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import orders from "./routes/order.js";
import kitchens from "./routes/kitchen.js";
import myorders from "./routes/myorder.js";

const app = express();

app.get('/',(req,res)=> {
  res.send('Payment engine is Running')
})
// app.get("/token", (req, res) =>{
//   try {
//     const token = makeToken();
//     res.json({token});
//   } catch (e) { next(e);}
// })
app.use(helmet());
// app.use(cors()); // allow everything
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") || true }));
app.use(express.json()); // for normal routes (webhook route handles raw body itself)

app.use("/api/orders", orders);
app.use("/api/kitchen", kitchens);
app.use("/api/myorder", myorders);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to database!");
    app.listen(process.env.PORT  , () => {
    console.log("Server listening on", process.env.PORT );
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });

