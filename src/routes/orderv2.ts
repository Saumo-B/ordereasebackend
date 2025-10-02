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
    const { items = [], customer, branch, cookingInstructions } = req.body || {};

    // Calculate total based on active qty
    const amount = items.reduce(
      (sum: number, it: any) => sum + it.price * (it.status?.active ?? 0),
      0
    );

    const orderToken = await makeToken(branch);

    // Build order object
    const newOrder = new Order({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      branch,
      orderToken,
      paymentMethod: "counter",
      cookingInstructions, // 🔹 store instructions
    }) as OrderDoc;

    // Reserve inventory first
    await reserveInventory(newOrder, session);

    // Save order after reservation succeeds
    const order = await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      token: order.orderToken,
      cookingInstructions: order.cookingInstructions, // 🔹 return it
    });
  } catch (e: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Order creation failed:", e);
    return res
      .status(400)
      .json({ error: e.message || "Order creation failed" });
  }
});

export default router;
