import { Router } from "express";
import "dotenv/config";
import { Order,OrderDoc } from "../models/Order";
import { makeToken } from "../lib/token";
import { MenuItem } from "../models/Menu";
import { reserveInventory, releaseInventory } from "../lib/inventoryService";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest} from "pg-sdk-node";
import mongoose, { Types } from "mongoose";

// --- Inline types ---

type LineItemInput = {
  menuItem: mongoose.Types.ObjectId;
  qty: number;
  price: number;
  served?: boolean;
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
    const { items = [], customer,branch,cookingInstructions } = req.body || {};

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
    const orderToken = await makeToken(branch);
    const order = await Order.create({
      status: "created",
      amount,
      currency: "INR",
      lineItems: items,
      customer,
      branch,
      orderToken,
      cookingInstructions,
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

async function runWithRetry<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();

      if (err.message.includes("Write conflict") && i < retries - 1) {
        console.warn(`Retrying transaction (attempt ${i + 1})`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Transaction failed after retries");
}

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], customer } = req.body;

    const result = await runWithRetry(async (session) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid order ID");
      }

      const order = await Order.findById(id).session(session);
      if (!order) throw new Error("Order not found");
      if (order.status === "paid") throw new Error("Paid orders cannot be updated");

      // Release old inventory
      await releaseInventory(
        order.lineItems.map((it) => ({

          menuItem: it.menuItem,
          qty: it.status?.active ?? 0,
        })),
        session
      );

      // Update line items
      order.lineItems = items.map((it: any) => ({
        menuItem: it.menuItem,
        status: it.status,
        price: it.price,
      }));

      // Reserve new inventory
      await reserveInventory(order, session);

      // Recalculate total
      order.amount = order.lineItems.reduce(
        (sum, it) =>
          sum + ((it.status?.active ?? 0) + (it.status?.served ?? 0)) * it.price,
        0
      );

      if (customer) order.customer = { ...order.customer, ...customer };
      if (order.served) order.served = false;

      await order.save({ session });
      return { message: "Order updated successfully", order };
    });

    res.json(result);
  } catch (e: any) {
    console.error("Order update failed:", e);
    res.status(400).json({ error: e.message || "Order update failed" });
  }
});

router.delete("/:orderId", async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: "Invalid MongoDB ObjectId" });
    }

    // Fetch the order
    const order = await Order.findById(orderId).session(session) as OrderDoc | null;
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Order not found" });
    }

    // Release reserved inventory for this order
    await releaseInventory(order.lineItems.map(li => ({
      menuItem: li.menuItem,
      qty: (li.status?.active??0)
    })), session);

    // Delete the order
    await order.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({
      message: "Order deleted successfully",
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Order delete error:", err);
    return res.status(400).json({ error: err instanceof Error ? err.message : "Failed to delete order" });
  }
});
export default router;
