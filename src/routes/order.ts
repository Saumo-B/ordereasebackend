import { Router } from "express";
import "dotenv/config";
import { Order,OrderDoc } from "../models/Order";
import { makeToken } from "../lib/token";
import { MenuItem } from "../models/Menu";
import { reserveInventory, releaseInventory } from "../lib/inventoryService";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest} from "pg-sdk-node";
import mongoose, { Types } from "mongoose";

// --- Inline types ---

type LineItem = {
  menuItem: Types.ObjectId;
  served: boolean;
  qty: number;
  price: number;
};

type Customer = {
  name?: string;
  phone?: string;
};

// type OrderDoc = mongoose.Document & {
//   lineItems: LineItem[];
//   status: "created" | "paid" | "done" | "failed";
//   served: boolean;
//   amount: number;
//   currency: string;      // <-- add this
//   orderToken: string;    // <-- add this
//   customer?: Customer;
//   createdAt?: Date;
//   updatedAt?: Date;
// };
const router = Router();

const client= StandardCheckoutClient.getInstance(process.env.MERCHANT_ID!,process.env.SALT_KEY!, parseInt(process.env.SALT_INDEX!), Env.SANDBOX)
    
// Create order
router.post("/", async (req, res, next) => {
  try {
    const { items = [], customer } = req.body || {};

    // 🔹 Validate items
    for (const { menuItem, qty, price } of items) {
      if (!menuItem || !qty || !price) {
        return res.status(400).json({ error: "menuItem, qty and price are required" });
      }

      // Ensure menuItem exists
      const menuDoc = await MenuItem.findById(menuItem);
      if (!menuDoc) {
        return res.status(400).json({ error: `MenuItem not found: ${menuItem}` });
      }

      if (qty <= 0) {
        return res.status(400).json({ error: `Invalid qty for ${menuDoc.name}` });
      }
      if (price <= 0) {
        return res.status(400).json({ error: `Invalid price for ${menuDoc.name}` });
      }
    }

    // 🔹 Calculate total
    const amount = items.reduce((sum: number, it: any) => sum + it.price * it.qty, 0);

    // 🔹 Create order
    const orderToken = await makeToken();
    const order = await Order.create({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      orderToken,
      paymentMethod: "paymentgateway",
    }) ;
       try {
            await reserveInventory(order); // checks availability & increments reservedQuantity
          } catch (err) {
            return res.status(400).json({ error: err instanceof Error ? err.message : "Not enough stock" });
          }
    
    // 🔹 Setup redirect URL for PhonePe
    const redirectUrl = `${process.env.BACKEND_ORIGIN!}/api/orders/status?id=${order.id}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderToken)
      .amount(amount * 100) // paise
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);

    return res.json({
      checkoutPageUrl: response.redirectUrl,
    });
  } catch (e: any) {
    console.error("PhonePe error:", e.response?.data || e.message);
    return res.status(400).json({ error: e.response?.data || e.message });
  }
});

// Get order status (by Mongo _id)
router.get("/status", async (req, res, next) => {
  try {
    const { id } = req.query;
    console.log("Incoming id:", id);

    if (!id || typeof id !== "string") {
      return res.status(400).send("Order Id missing");
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    // Find order by MongoDB _id
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (!order.orderToken) {
      return res.status(400).json({ error: "Order token missing" });
    }

    // Call PhonePe with orderToken
    const response = await client.getOrderStatus(order.orderToken);
    const status = response.state; // COMPLETED, FAILED, etc.

    // Update order status in DB + redirect
    if (status === "COMPLETED") {
      order.status = "paid";
      await order.save();
      return res.redirect(`${process.env.FRONTEND_ORIGIN!}/order/${order._id}?history=replace`);
    } else {
      order.status = "failed";
      await order.save();
      return res.redirect(`${process.env.FRONTEND_ORIGIN!}/failure`);
    }
  } catch (e) {
    console.error("Status check error:", e);
    next(e);
  }
});


router.get("/detail", async (req, res, next) => {
  try {
    const { id } = req.query;

    console.log("Incoming id:", id);

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Order Id missing" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    const order = await Order.findById(new mongoose.Types.ObjectId(id)).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (e) {
    console.error("Detail fetch error:", e);
    next(e);
  }
});

// router.put("/:id", async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { items = [], customer } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
//     }
//     if (!Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ error: "No items provided" });
//     }

//     const order = await Order.findById(id);
//     if (!order) return res.status(404).json({ error: "Order not found" });

//     const wasPaid = order.status === "paid";
//     let newItemsTotal = 0;

//     // Merge items & compute newItemsTotal
//     for (const { sku, qty, price } of items) {
//       if (!sku || !Number.isFinite(qty) || qty <= 0) {
//         return res.status(400).json({ error: `Invalid qty for sku ${sku || "(missing)"}` });
//       }

//       const existing = order.lineItems.find((it: any) => it.sku === sku);
//       if (existing) {
//         existing.qty += qty;
//         newItemsTotal += qty * existing.price;        // use existing price
//       } else {
//         if (!Number.isFinite(price) || price <= 0) {
//           return res.status(400).json({ error: `Missing/invalid price for new sku ${sku}` });
//         }
//         order.lineItems.push({ sku, qty, price });    // store in paise
//         newItemsTotal += qty * price;
//       }
//     }

//     // Recalculate grand total
//     order.amount = order.lineItems.reduce((sum: number, it: any) => sum + it.qty * it.price, 0);

//     // Merge customer
//     if (customer) order.customer = { ...order.customer, ...customer };

//     // ✅ Correct amountDue logic
//     if (wasPaid) {
//       // order was fully paid, only new items are due
//       order.amountDue = newItemsTotal;
//       if (newItemsTotal > 0) order.status = "created"; // revert to unpaid if new dues exist
//     } else {
//       // order wasn't fully paid → add new items to current due
//       order.amountDue = (order.amountDue || 0) + newItemsTotal;
//     }

//     // Adding items means it can't stay served
//     if (order.served) order.served = false;

//     await order.save();
//     return res.json({ message: "Order updated successfully", order });
//   } catch (e) {
//     console.error("Order update error:", e);
//     next(e);
//   }
// });

// PATCH /api/orders/:id


// PATCH /orders/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items = [], customer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId for order" });
    }

    // Fetch the order
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Block updates if already paid
    if (order.status === "paid") {
      return res.status(400).json({ error: "Paid orders cannot be updated" });
    }

    // Validate new items
    for (const { menuItem, qty, price } of items) {
      if (!mongoose.Types.ObjectId.isValid(menuItem)) {
        return res.status(400).json({ error: `Invalid menuItem ID: ${menuItem}` });
      }

      const menuDoc = await MenuItem.findById(menuItem);
      if (!menuDoc) {
        return res.status(400).json({ error: `MenuItem not found: ${menuItem}` });
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: `Invalid qty for menuItem ${menuDoc.name}` });
      }

      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: `Missing/invalid price for menuItem ${menuDoc.name}` });
      }
    }

    // Release inventory for old items
    await releaseInventory(
      order.lineItems.map((it) => ({
        menuItem: it.menuItem,
        qty: it.qty,
      }))
    );

    // Replace items
      order.lineItems = items.map((it: { menuItem: mongoose.Types.ObjectId; qty: number; price: number }) => ({
        menuItem: it.menuItem,
        qty: it.qty,
        price: it.price,
        served: false,
      })) as typeof order.lineItems;  // Properly cast to DocumentArray type

    // Reserve inventory for new items
    try {
      await reserveInventory(order);
    } catch (err) {
      return res
        .status(400)
        .json({ error: err instanceof Error ? err.message : "Not enough stock" });
    }

    // Recalculate total
    order.amount = order.lineItems.reduce((sum, it) => sum + it.qty * it.price, 0);

    // Merge customer info
    if (customer) {
      order.customer = { ...order.customer, ...customer };
    }

    // Reset served flag if needed
    if (order.served) order.served = false;

    // Save changes
    await order.save();

    return res.json({ message: "Order updated successfully", order });
  } catch (e) {
    console.error("Order update error:", e);
    next(e);
  }
});


router.delete("/:orderId", async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({
      message: "Order deleted successfully",
      // order: deletedOrder,
    });
  } catch (e) {
    console.error("Order delete error:", e);
    next(e);
  }
});
export default router;
