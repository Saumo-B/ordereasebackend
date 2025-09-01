import { Router } from "express";
import "dotenv/config";
import { Order } from "../models/Order.js";
import { makeToken } from "../lib/token.js";
import mongoose from "mongoose";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest} from "pg-sdk-node";

const router = Router();

const client= StandardCheckoutClient.getInstance(process.env.MERCHANT_ID,process.env.SALT_KEY, parseInt(process.env.SALT_INDEX), Env.SANDBOX)
    
// Create order
router.post("/", async (req, res, next) => {
  try {
    const { items = [], customer } = req.body || {};
    const amount = items.reduce((sum: number, it: any) => sum + it.price * it.qty, 0);
    const orderToken = makeToken()
    const order = await Order.create({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      orderToken,
    });

    const  redirectUrl= `${process.env.BACKEND_ORIGIN}/api/orders/status?id=${order.id}`;
    const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(orderToken)
    .amount(amount*100)
    .redirectUrl(redirectUrl)
    .build()
    const response = await client.pay(request)

    return res.json({
      // id: order.id,
      // amount: order.amount,
      // currency: order.currency,
      // token: order.orderToken,
      checkoutPageUrl:response.redirectUrl // include PhonePe response
    });
  } catch (e: any) {
    console.error("PhonePe error:", e.response?.data || e.message);
    return res.status(400).json({ error: e.response?.data || e.message });
  }
});

// Get order status (by Mongo _id)
router.get("/status", async (req, res, next) => {
  try {
    const { id } = req.query;
    console.log("Incoming id:", id);

    if (!id || typeof id !== "string") {
      return res.status(400).send("Order Id missing");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    // Find order by MongoDB _id
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.orderToken) {
      return res.status(400).json({ error: "Order token missing" });
    }

    // Call PhonePe with orderToken
    const response = await client.getOrderStatus(order.orderToken);
    const status = response.state; // COMPLETED, FAILED, etc.

    // Update order status in DB + redirect
    if (status === "COMPLETED") {
      order.status = "paid";
      await order.save();
      return res.redirect(`${process.env.FRONTEND_ORIGIN}/order/${order._id}`);
    } else {
      order.status = "failed";
      await order.save();
      return res.redirect(`${process.env.FRONTEND_ORIGIN}/failure`);
    }
  } catch (e) {
    console.error("Status check error:", e);
    next(e);
  }
});


router.get("/detail", async (req, res, next) => {
  try {
    const { id } = req.query;

    console.log("Incoming id:", id);

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Order Id missing" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    const order = await Order.findById(new mongoose.Types.ObjectId(id)).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (e) {
    console.error("Detail fetch error:", e);
    next(e);
  }
});

export default router;
