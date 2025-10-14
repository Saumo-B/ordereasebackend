import { Router } from "express";
import "dotenv/config";
import { deductInventory } from "../lib/inventoryService";
import { Order} from "../models/Order";
import { Ingredient } from "../models/Ingredients"; 
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import mongoose from "mongoose";

dayjs.extend(utc);
dayjs.extend(timezone);

const router = Router();
const TZ = "Asia/Kolkata"; // Force IST

// Get all orders for today (IST)
// router.get("/today" , async (req, res, next) => {
//   try {
//     const branchId = req.query.branch; // 👈 Branch ID passed in query

//     if (!branchId) {
//       return res.status(400).json({ message: "Branch ID is required" });
//     }

//     const startOfDay = dayjs().tz(TZ).startOf("day").toDate();
//     const endOfDay = dayjs().tz(TZ).endOf("day").toDate();

//     const orders = await Order.find({
//       branch: branchId, // 👈 filter by branch
//       createdAt: { $gte: startOfDay, $lte: endOfDay },
//     })
//       .sort({ createdAt: -1 })
//       .populate("lineItems.menuItem", "name") // only fetch menuItem name
//       .lean();

//     // 🔹 Transform: flatten menuItem into name
//     const transformed = orders.map(order => ({
//       ...order,
//       lineItems: order.lineItems.map((li: any) => ({
//         active: li.status?.active || 0,
//         price: li.price,
//         served: li.status?.served || 0,
//         name: li.menuItem?.name || "Unknown",
//       })),
//     }));

//     return res.json({
//       count: transformed.length,
//       orders: transformed,
//     });
//   } catch (e) {
//     console.error("Fetch today's orders error:", e);
//     next(e);
//   }
// });
router.get("/today", async (req, res, next) => {
  try {
    const branchId = req.query.branch;

    if (!branchId) {
      return res.status(400).json({ message: "Branch ID is required" });
    }

    const startOfDay = dayjs().tz(TZ).startOf("day").toDate();
    const endOfDay = dayjs().tz(TZ).endOf("day").toDate();

    const orders = await Order.find({
      branch: branchId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "done" }, // 👈 This line filters out completed orders
    })
      .sort({ createdAt: -1 })
      .populate("lineItems.menuItem", "name")
      .lean();

    const transformed = orders.map(order => ({
      ...order,
      lineItems: order.lineItems.map((li: any) => ({
        active: li.status?.active || 0,
        price: li.price,
        served: li.status?.served || 0,
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
    if (!allowedStatuses.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findById(orderId)
      .populate("lineItems.menuItem", "name")
      .session(session);

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Case: paid
    if (status === "paid") {
      if (order.status === "paid")
        return res.status(409).json({ message: "Order already paid" });

      await deductInventory(order, session);

      order.status = "paid";
      if (order.served) order.status = "done";

      await order.save({ session });
      await session.commitTransaction();
    }

    // Case: served
    else if (status === "served") {
      order.served = true;

      order.lineItems.forEach((li: any) => {
        if (li.status) {
          li.status.served += li.status.active || 0;
          li.status.active = 0;
        }
      });

      if (order.status === "paid") order.status = "done";

      await order.save({ session });
      await session.commitTransaction();
    }

    // Other statuses
    else {
      order.status = status;
      await order.save({ session });
      await session.commitTransaction();
    }

    // Transform response
    const transformed = {
      _id: order._id,
      status: order.status,        // never "served"
      amount: order.amount,
      currency: order.currency,
      served: order.served,        // boolean flag
      lineItems: order.lineItems.map((li: any) => ({
        active: li.status?.active || 0,
        price: li.price,
        served: li.status?.served || 0,
        name: (li.menuItem as any)?.name || "Unknown Item",
      })),
      customer: order.customer,
      orderToken: order.orderToken,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      __v: order.__v,
    };

    const message = (order.status === "done"
                    ? "Order Completed"
                    : status === "paid"
                    ? "Order Paid"
                    : order.served
                    ? "Order Served"
                    : `Order status updated to ${status}`
                    );

    return res.json({ message, order: transformed });
  } catch (err) {
    await session.abortTransaction();
    console.error("Order status update failed:", err);
    next(err);
  } finally {
    session.endSession();  // Ensure session is always ended
  }
});

// 📊 GET /api/kitchen/dashboard-stats (IST-based)
router.get("/dashboard-stats", async (req, res, next) => {
  try {
    const branchId = req.query.branch as string;
    if (!branchId) {
      return res.status(400).json({ error: "Branch ID is required in query param" });
    }

    const startOfToday = dayjs().tz(TZ).startOf("day").toDate();
    const endOfToday = dayjs().tz(TZ).endOf("day").toDate();

    const startOfYesterday = dayjs().tz(TZ).subtract(1, "day").startOf("day").toDate();
    const endOfYesterday = dayjs().tz(TZ).subtract(1, "day").endOf("day").toDate();

    // ---- Fetch orders (branch scoped)
    const todayOrders = await Order.find({
      branch: branchId,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }).populate("lineItems.menuItem");

    const yesterdayOrders = await Order.find({
      branch: branchId,
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

    // ---- Low Stock Items (branch scoped)
    const allIngredients = await Ingredient.find({ branch: branchId }).lean();
    const lowStockItems = allIngredients
      .filter(i => i.quantity <= (i.lowStockThreshold ?? 5))
      .map(i => ({
        _id: i._id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        lowStockWarning: true,
      }));

    // ---- Repeat Customer Count
    const customerOrderMap: Record<string, number> = {};
    for (const order of todayOrders) {
      const phone = order.customer?.phone;
      if (phone) {
        customerOrderMap[phone] = (customerOrderMap[phone] || 0) + 1;
      }
    }
    const repeatCustomerCount = Object.values(customerOrderMap).filter(count => count > 1).length;

    // ---- Average Prep Time (placeholder)
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
    const { startDate, endDate, branchId } = req.query as { startDate?: string; endDate?: string; branchId?: string };

    // --- Validate required params
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required (YYYY-MM-DD)" });
    }

    // --- Validate branchId if provided
    if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ error: "Invalid branchId" });
    }

    const start = dayjs(startDate).startOf("day").toDate();
    const end = dayjs(endDate).endOf("day").toDate();

    // --- Build query filter
    const filter: any = { createdAt: { $gte: start, $lte: end } };
    if (branchId) filter.branch = branchId;

    // --- Fetch orders
    const orders = await Order.find(filter)
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

    // --- Summary
    const paidOrders = orders.filter(o => ["paid", "done"].includes(o.status));
    const refundedOrders = orders.filter(o => o.status === "failed");

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = paidOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalRefunds = refundedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const refundedOrdersCount = refundedOrders.length;

    // --- Sales trend by date
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

    // --- Item analysis
    const itemMap: Record<string, { quantity: number; revenue: number }> = {};
    for (const order of paidOrders) {
      for (const li of order.lineItems) {
        const name = (li.menuItem as any)?.name || "Unknown Item";
        const qty = ((li.status?.active ?? 0) + (li.status?.served ?? 0)); // total qty
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

    // --- Customer insights
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

    // --- Payment methods
    const methodMap: Record<string, number> = {};
    for (const order of paidOrders) {
      const method = (order as any).paymentMethod || "Unknown";
      methodMap[method] = (methodMap[method] || 0) + 1;
    }
    const paymentMethods = Object.entries(methodMap).map(([method, count]) => ({ method, count }));

    // --- Detailed orders
    const detailedOrders = paidOrders.map(o => ({
      id: o._id,
      token: o.orderToken,
      date: o.createdAt,
      customerName: o.customer?.name || "Guest",
      total: o.amount,
      status: o.status,
    }));

    // --- Response
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
