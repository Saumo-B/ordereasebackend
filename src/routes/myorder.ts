import { Router } from "express";
import { Order } from "../models/Order.ts";

const router = Router();

// GET /api/myorders?phone=1234567890   (will auto-convert to +911234567890)
router.get("/", async (req, res, next) => {
  try {
    let { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Convert to string and normalize
    phone = String(phone).trim();

    // // If it doesn't already start with +91, add it
    // if (!phone.startsWith("+91")) {
      phone = "+91" + phone;
    // }

    const orders = await Order.find({ "customer.phone": phone })
      .sort({ createdAt: -1 })
      .limit(5);

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this phone number" });
    }

    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

export default router;
