import mongoose from "mongoose";

const LineItem = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  served: { type: Boolean, default: false },
  qty: { type: Number, required: true },
  price: { type: Number, required: true } 
});


const OrderSchema = new mongoose.Schema({
  phonepeOrderId: { type: String, index: true },
  status: { type: String, enum: ["created","paid","done","failed"], default: "created" },
  amount: { type: Number, required: true },  
  currency: { type: String, default: "INR" },
  served: { type: Boolean, default: false },
  lineItems: [LineItem],
  customer: {
    name: String,
    phone: String
  },
  orderToken: { type: String },
}, { timestamps: true });

export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema> & {_id: string};
export const Order = mongoose.model("Order", OrderSchema);
