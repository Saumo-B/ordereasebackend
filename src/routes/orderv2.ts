import { Router } from "express";
import "dotenv/config";
import { Order } from "../models/Order";
import { makeToken } from "../lib/token";
import mongoose from "mongoose";
// import { StandardCheckoutClient, Env, StandardCheckoutPayRequest} from "pg-sdk-node";

const router = Router();

// Create order
router.post("/", async (req, res, next) => {
  try {
    const { items = [], customer } = req.body || {};
    const amount = items.reduce((sum: number, it: any) => sum + it.price * it.qty, 0);
    const amountDue = amount;
    const orderToken = makeToken()
    const order = await Order.create({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      orderToken,
      amountDue,
    });

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      token: order.orderToken,
     });
  } catch (e: any) {
    return res.status(400).json({ error: e.response?.data || e.message });
  }
});

export default router;
