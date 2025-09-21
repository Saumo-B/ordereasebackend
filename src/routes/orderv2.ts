import { Router } from "express";
import "dotenv/config";
import { Order,OrderDoc } from "../models/Order";
import { makeToken } from "../lib/token";
import { reserveInventory } from "../lib/inventoryService";
import mongoose, { Types } from "mongoose";

const router = Router();

// Create order
router.post("/", async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items = [], customer } = req.body || {};

    if (!items.length) {
      return res.status(400).json({ error: "Order must have at least one item" });
    }

    const amount = items.reduce((sum: number, it: any) => sum + it.price * it.qty, 0);
    const orderToken = await makeToken();

    // Build order (not saved yet)
    const newOrder = new Order({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      orderToken,
      paymentMethod: "counter",
    }) as OrderDoc;

    // Reserve ingredients atomically
    await reserveInventory(newOrder, session);

    // Save the order only after reservation succeeds
    const order = await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      token: order.orderToken,
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to create order",
    });
  }
});

export default router;
