import { Order } from "../models/Order";

export async function makeToken(branchId: string) {
  // Start of today (midnight)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count today's orders for this branch
  const todayCount = await Order.countDocuments({
    branch: branchId, // Filter by branch
    createdAt: { $gte: startOfDay }
  });

  // Token = (count % 9999) + 1
  const tokenNumber = (todayCount % 9999) + 1;

  return tokenNumber.toString().padStart(4, "0"); // "0001" → "9999"
}
