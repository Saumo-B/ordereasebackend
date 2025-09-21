import { Router } from "express";
import "dotenv/config";
import { Order,OrderDoc } from "../models/Order";
import { makeToken } from "../lib/token";
import { reserveInventory } from "../lib/inventoryService";
import mongoose, { Types } from "mongoose";

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
      paymentMethod: "counter",
    }) as OrderDoc;
    try {
        await reserveInventory(order); // checks availability & increments reservedQuantity
      } catch (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : "Not enough stock" });
      }


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
