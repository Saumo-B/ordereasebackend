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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: "Status is required" });
    const allowedStatuses = ["created", "paid", "done", "failed", "served"];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findById(orderId).session(session);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status === "paid") {
      if (order.status === "paid") return res.status(409).json({ message: "Order already paid" });

      // Deduct inventory
      await deductInventory(order, session);

      order.status = "paid";
      if (order.served) order.status = "done";

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.json({ message: order.status === "done" ? "Order Completed" : "Order Paid", order });
    }

    if (status === "served") {
      order.served = true;
      order.lineItems.forEach((li) => (li.served = true));
      if (order.status === "paid") order.status = "done";

      await order.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.json({ message: order.status === "done" ? "Order Completed" : "Order Served", order });
    }

    // Other statuses
    order.status = status;
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.json({ message: `Order status updated to ${status}`, order });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Order status update failed:", err);
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

    // Fetch all orders in range (include refunds for summary)
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate("lineItems.menuItem")
      .sort({ createdAt: 1 })
      .lean();

    if (!orders.length) {
      return res.json({
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalRefunds: 0,
          refundedOrdersCount: 0,
        },
        salesTrend: [],
        itemAnalysis: { topSellingItems: [] },
        customerInsights: {
          newVsReturning: { new: 0, returning: 0 },
          highSpendersCount: 0,
        },
        paymentMethods: [],
        detailedOrders: [],
      });
    }

    // ---- Summary
    const paidOrders = orders.filter(o => ["paid", "done"].includes(o.status));
    const refundedOrders = orders.filter(o => o.status === "failed");

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = paidOrders.length;  
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalRefunds = refundedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const refundedOrdersCount = refundedOrders.length;

    // ---- Sales trend (group by date)
    const trendMap: Record<string, { revenue: number; count: number }> = {};
    for (const order of paidOrders) {
      const date = dayjs(order.createdAt).format("YYYY-MM-DD");
      if (!trendMap[date]) trendMap[date] = { revenue: 0, count: 0 };
      trendMap[date].revenue += order.amount || 0;
      trendMap[date].count += 1;
    }
    const salesTrend = Object.entries(trendMap).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orderCount: v.count,
    }));

    // ---- Item analysis
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const li of order.lineItems) {
        const name = (li.menuItem as any)?.name || "Unknown Item";
        const qty = li.qty || 0;
        const revenue = (li.price || 0) * qty;
        if (!itemMap[name]) itemMap[name] = { quantity: 0, revenue: 0 };
        itemMap[name].quantity += qty;
        itemMap[name].revenue += revenue;
      }
    }
    const topSellingItems = Object.entries(itemMap)
      .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // ---- Customer insights
    const customerMap: Record<string, number> = {};
    for (const order of paidOrders) {
      const phone = order.customer?.phone;
      if (phone) customerMap[phone] = (customerMap[phone] || 0) + 1;
    }
    const newCustomers = Object.values(customerMap).filter(c => c === 1).length;
    const returningCustomers = Object.values(customerMap).filter(c => c > 1).length;

    const highSpendersCount = Object.values(customerMap).filter(
      phoneOrderCount =>
        paidOrders
          .filter(o => o.customer?.phone && customerMap[o.customer.phone] === phoneOrderCount)
          .reduce((sum, o) => sum + (o.amount || 0), 0) > 5000 // Example: >5000 spent
    ).length;

    // ---- Payment methods
    // Assuming you have payment method info (if not, you’ll need to add a field)
    const methodMap: Record<string, number> = {};
    for (const order of paidOrders) {
      const method = (order as any).paymentMethod || "Unknown";
      methodMap[method] = (methodMap[method] || 0) + 1;
    }
    const paymentMethods = Object.entries(methodMap).map(([method, count]) => ({ method, count }));

    // ---- Detailed orders
    const detailedOrders = paidOrders.map(o => ({
      id: o._id,
      token: o.orderToken,
      date: o.createdAt,
      customerName: o.customer?.name || "Guest",
      total: o.amount,
      status: o.status,
    }));

    // ---- Response
    return res.json({
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        totalRefunds,
        refundedOrdersCount,
      },
      salesTrend,
      itemAnalysis: { topSellingItems },
      customerInsights: {
        newVsReturning: {
          new: newCustomers,
          returning: returningCustomers,
        },
        highSpendersCount,
      },
      paymentMethods,
      detailedOrders,
    });
  } catch (err) {
    console.error("Sales report error:", err);
    next(err);
  }
});

export default router;
