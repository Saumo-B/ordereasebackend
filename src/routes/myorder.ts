import { Router } from "express";
import { Order } from "../models/Order";

const router = Router();

// GET /api/myorder?phone=1234567890&branch=670e5c3b85a2b456ea94d2c8
router.get("/", async (req, res, next) => {
  try {
    let { phone, branch } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Normalize phone number
    phone = String(phone).trim();
    if (!phone.startsWith("+91")) {
      phone = "+91" + phone;
    }

    // Build filter
    const filter: any = { "customer.phone": phone };
    if (branch) filter.branch = branch;

    // Fetch recent orders
    const orders = await Order.find(filter)
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
