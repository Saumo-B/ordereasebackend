import { Router } from "express";
import "dotenv/config";
import { deductInventory } from "../lib/inventoryService";
import { Order,OrderDoc } from "../models/Order";
import { Ingredient } from "../models/Ingredients"; 
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import mongoose, { Types } from "mongoose";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = Router();
const TZ = "Asia/Kolkata"; // Force IST

// Get all orders for today (IST)
router.get("/today", async (req, res, next) => {
  try {
    const startOfDay = dayjs().tz(TZ).startOf("day").toDate();
    const endOfDay = dayjs().tz(TZ).endOf("day").toDate();

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .sort({ createdAt: -1 })
      .populate("lineItems.menuItem", "name") // only fetch menuItem name
      .lean();

    // Transform: replace menuItem with its name
    const transformed = orders.map(order => ({
      ...order,
      lineItems: order.lineItems.map((li: any) => ({
        qty: li.qty,
        price: li.price,
        name: li.menuItem?.name || "Unknown",
      })),
    }));

    return res.json({
      count: transformed.length,
      orders: transformed,
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

    if (!status) {
      return res.status(400).json({ error: "Status is required in request body" });
    }

    const allowedStatuses = ["created", "paid", "done", "failed", "served"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // --- Handle "paid" with atomic update
    if (status === "paid") {
      // Atomically set status to 'paid' only if not already paid
      const order = await Order.findOneAndUpdate<OrderDoc>(
        { _id: orderId, status: { $ne: "paid" } },
        { $set: { status: "paid" } },
        { new: true } // return updated document
      );

      if (!order) {
        return res.status(409).json({ message: "Order already Paid" });
      }

      // Deduct inventory safely
      try {
        await deductInventory(order);
      } catch (err) {
        // Optionally revert order status if deduction fails
        await Order.findByIdAndUpdate(order._id, { status: "created" });
        return res.status(400).json({ error: err instanceof Error ? err.message : "Inventory error" });
      }

      // If already served, mark as done
      if (order.served) {
        order.status = "done";
        await order.save();
        return res.json({ message: "Order Completed", order });
      }

      return res.json({ message: "Order status updated to paid", order });
    }
    // --- Handle "served" (atomic as well)
    if (status === "served") {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // mark order as served
      order.served = true;

      // mark all line items as served
      order.lineItems.forEach(item => {
        item.served = true;
      });

      // if already paid, close the order
      if (order.status === "paid") {
        order.status = "done";
      }

      await order.save();

      return res.json({
        message: order.status === "done" ? "Order Completed" : "Order is Served",
        order,
      });
    }

    // --- Other statuses
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    next(err);
  }
});


// 📊 GET /api/kitchen/dashboard-stats (IST-based)
router.get("/dashboard-stats", async (req, res, next) => {
  try {
    const startOfToday = dayjs().tz(TZ).startOf("day").toDate();
    const endOfToday = dayjs().tz(TZ).endOf("day").toDate();

    const startOfYesterday = dayjs().tz(TZ).subtract(1, "day").startOf("day").toDate();
    const endOfYesterday = dayjs().tz(TZ).subtract(1, "day").endOf("day").toDate();

    // ---- Fetch orders
    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }).populate("lineItems.menuItem");

    const yesterdayOrders = await Order.find({
      createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    // ---- If no data
    if (!todayOrders.length && !yesterdayOrders.length) {
      return res.json({
        kpis: {
          todaysSales: 0,
          yesterdaysSales: 0,
          orderCounts: { total: 0, completed: 0, pending: 0, cancelled: 0 },
          averageOrderValue: 0,
          lowStockItemCount: 0,
          repeatCustomerCount: 0,
          averagePrepTimeMinutes: 0,
        },
        salesTodayByHour: [],
        salesYesterdayByHour: [],
        lowStockItems: [],
      });
    }

    // ---- Helpers
    const calcRevenue = (orders: any[]) =>
      orders.filter(o => ["paid", "done"].includes(o.status))
            .reduce((sum, o) => sum + (o.amount || 0), 0);

    const groupByHour = (orders: any[]) => {
      const salesByHourMap: Record<string, number> = {};
      for (const order of orders.filter(o => ["paid", "done"].includes(o.status))) {
        const hour = dayjs(order.createdAt).tz(TZ).hour();
        const label =
          hour === 0 ? "12am" :
          hour < 12 ? `${hour}am` :
          hour === 12 ? "12pm" : `${hour - 12}pm`;
        salesByHourMap[label] = (salesByHourMap[label] || 0) + (order.amount || 0);
      }
      return Object.entries(salesByHourMap).map(([hour, revenue]) => ({ hour, revenue }));
    };

    // ---- KPIs
    const todaysSales = calcRevenue(todayOrders);
    const yesterdaysSales = calcRevenue(yesterdayOrders);
    const orderCounts = {
      total: todayOrders.length,
      completed: todayOrders.filter(o => o.status === "done").length,
      pending: todayOrders.filter(o => o.status === "created").length,
      cancelled: todayOrders.filter(o => o.status === "failed").length,
    };
    const averageOrderValue =
      orderCounts.total > 0 ? todaysSales / orderCounts.total : 0;

    // ---- Low Stock Items (threshold: < 5 units/kg/etc)
    const lowStockItems = await Ingredient.find({ quantity: { $lt: 5 } })
      .select("name quantity unit")
      .lean();

    // ---- Repeat Customer Count (customers who placed >1 order today)
    const customerOrderMap: Record<string, number> = {};
    for (const order of todayOrders) {
      const phone = order.customer?.phone;
      if (phone) {
        customerOrderMap[phone] = (customerOrderMap[phone] || 0) + 1;
      }
    }
    const repeatCustomerCount = Object.values(customerOrderMap).filter(count => count > 1).length;


    // ---- Average Prep Time (placeholder, unless you track `prepTime`)
    const averagePrepTimeMinutes = 15;

    return res.json({
      kpis: {
        todaysSales,
        yesterdaysSales,
        orderCounts,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        lowStockItemCount: lowStockItems.length,
        repeatCustomerCount,
        averagePrepTimeMinutes,
      },
      salesTodayByHour: groupByHour(todayOrders),
      salesYesterdayByHour: groupByHour(yesterdayOrders),
      lowStockItems,
    });
  } catch (e) {
    console.error("Dashboard stats error:", e);
    next(e);
  }
});

router.get("/sales-report", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required (YYYY-MM-DD)" });
    }

    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // Fetch orders in range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["paid", "done"] }, // only count successful orders
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!orders.length) {
      return res.json({
        summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 },
        salesTrend: [],
        orders: [],
      });
    }

    // ---- Summary
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalRevenue / totalOrders;

    // ---- Sales trend (group by date)
    const trendMap: Record<string, number> = {};
    for (const order of orders) {
      const date = dayjs(order.createdAt).format("YYYY-MM-DD");
      trendMap[date] = (trendMap[date] || 0) + (order.amount || 0);
    }
    const salesTrend = Object.entries(trendMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // ---- Response
    return res.json({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
      salesTrend,
      orders: orders.map(o => ({
        _id: o._id,
        orderToken: o.orderToken,
        customer: o.customer,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error("Sales report error:", err);
    next(err);
  }
});

export default router;
