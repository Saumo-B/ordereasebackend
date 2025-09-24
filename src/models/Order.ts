// import mongoose, { Types } from "mongoose";

// // --- LineItem interface ---
// export interface ILineItem {
//   menuItem: Types.ObjectId;   // reference to MenuItem
//   served: boolean;
//   qty: number;
//   price: number;
// }

// // --- Customer info interface ---
// export interface ICustomer {
//   name?: string;
//   phone?: string;
// }

// // --- Order interface ---
// export interface IOrder {
//   phonepeOrderId?: string;
//   status: "created" | "paid" | "done" | "failed";
//   amount: number;
//   currency?: string;
//   served: boolean;
//   lineItems: ILineItem[];
//   customer?: ICustomer;
//   orderToken?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// // Optional: For Mongoose document type
// export interface IOrderDoc extends IOrder, mongoose.Document {
//   _id: string;
// }

// const LineItem = new mongoose.Schema({
//   menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
//   served: { type: Boolean, default: false },
//   qty: { type: Number, required: true },
//   price: { type: Number, required: true } 
// });


// const OrderSchema = new mongoose.Schema({
//   phonepeOrderId: { type: String, index: true },
//   status: { type: String, enum: ["created","paid","done","failed"], default: "created" },
//   amount: { type: Number, required: true },  
//   currency: { type: String, default: "INR" },
//   served: { type: Boolean, default: false },
//   lineItems: [LineItem],
//   customer: {
//     name: String,
//     phone: String
//   },
//   orderToken: { type: String },
//   paymentMethod: { 
//   type: String, 
//   enum: ["paymentgateway", "counter"], 
//   required: true,
//   immutable: true 
// },
// }, { timestamps: true });


// export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema> & mongoose.Document;
// export const Order = mongoose.model("Order", OrderSchema);


import mongoose, { Types } from "mongoose";

// --- LineItem interface ---
export interface ILineItem {
  menuItem: Types.ObjectId;   // reference to MenuItem
  status: {
    active: number;
    served: number;
  };
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

// --- LineItem schema ---
const LineItem = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  status: {
    active: { type: Number, default: 0 },
    served: { type: Number, default: 0 }
  },
  price: { type: Number, required: true }
});

// Virtual property for qty (active + served)
LineItem.virtual('qty').get(function() {
  return (this.status?.active ?? 0) + (this.status?.served ?? 0);
});
// Enable virtuals for toJSON output
LineItem.set('toJSON', {
  virtuals: true
});

// --- Order schema ---
const OrderSchema = new mongoose.Schema({
  phonepeOrderId: { type: String, index: true },
  status: { type: String, enum: ["created", "paid", "done", "failed"], default: "created" },
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
  }
}, { timestamps: true });

// --- Export types and model ---
export type OrderDoc = mongoose.InferSchemaType<typeof OrderSchema> & mongoose.Document;
export const Order = mongoose.model("Order", OrderSchema);
