import mongoose from "mongoose";

const LineItem = new mongoose.Schema({
  sku: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true } // in paise
});

const OrderSchema = new mongoose.Schema({
  phonepeOrderId: { type: String, index: true },
  status: { type: String, enum: ["created","paid","done","failed"], default: "created" },
  amount: { type: Number, required: true },  // paise
  currency: { type: String, default: "INR" },
  lineItems: [LineItem],
  customer: {
    name: String,
    phone: String
  },
  orderToken: { type: String }, // filled after payment
}, { timestamps: true });

export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema> & {_id: string};
export const Order = mongoose.model("Order", OrderSchema);
