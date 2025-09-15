import { Router } from "express";
import "dotenv/config";
import { Order } from "../models/Order";
import { makeToken } from "../lib/token";

const router = Router();

// Create order
router.post("/", async (req, res, next) => {
  try {
    const { items = [], customer } = req.body || {};
    const amount = items.reduce((sum: number, it: any) => sum + it.price * it.qty, 0);
    const orderToken = await makeToken();

    const order = await Order.create({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      orderToken,
    });

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      token: order.orderToken,
    });
  } catch (e: any) {
    console.error("Order creation failed:", e);
    return res.status(400).json({ error: e.response?.data || e.message });
  }
});

export default router;
