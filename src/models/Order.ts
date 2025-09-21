import mongoose, { Types } from "mongoose";

// --- LineItem interface ---
export interface ILineItem {
  menuItem: Types.ObjectId;   // reference to MenuItem
  served: boolean;
  qty: number;
  price: number;
}

// --- Customer info interface ---
export interface ICustomer {
  name?: string;
  phone?: string;
}

// --- Order interface ---
export interface IOrder {
  phonepeOrderId?: string;
  status: "created" | "paid" | "done" | "failed";
  amount: number;
  currency?: string;
  served: boolean;
  lineItems: ILineItem[];
  customer?: ICustomer;
  orderToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Optional: For Mongoose document type
export interface IOrderDoc extends IOrder, mongoose.Document {
  _id: string;
}

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
  paymentMethod: { 
  type: String, 
  enum: ["paymentgateway", "counter"], 
  required: true,
  immutable: true 
},
}, { timestamps: true });


export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema> & mongoose.Document;
export const Order = mongoose.model("Order", OrderSchema);
