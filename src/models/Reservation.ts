// src/models/Reservation.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReservation {
  customerName: string;
  phone?: string;
  time: Date;
  partySize: number;
  table: Types.ObjectId;
}

export interface IReservationDoc extends IReservation, Document {
  _id: Types.ObjectId;
}

const ReservationSchema = new Schema<IReservationDoc>(
  {
    customerName: { type: String, required: true },
    phone: { type: String },
    time: { type: Date, required: true },
    partySize: { type: Number, required: true },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
  },
  { timestamps: true }
);

export const Reservation = mongoose.model<IReservationDoc>(
  "Reservation",
  ReservationSchema
);
