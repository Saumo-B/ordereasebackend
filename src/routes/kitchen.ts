import { Router } from "express";
import "dotenv/config";
import { Order } from "../models/Order.ts";

const router = Router();

// Get all orders for today
router.get("/today", async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      count: orders.length,
      orders,
    });
  } catch (e) {
    console.error("Fetch today's orders error:", e);
    next(e);
  }
});

// PATCH /api/kitchen/status/:orderId
router.patch("/status/:orderId", async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required in request body" });
    }

    // validate allowed statuses
    const allowedStatuses = ["created", "paid", "done", "failed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
