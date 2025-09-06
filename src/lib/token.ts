import { Order } from "../models/Order";

export async function makeToken() {
  // Start of today (midnight)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count today's orders
  const todayCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay }
  });

  // Token = (count % 9999) + 1
  const tokenNumber = (todayCount % 9999) + 1;

  return tokenNumber.toString().padStart(4, "0"); // "0001" → "9999"
}
