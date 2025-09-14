// src/models/Table.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITable {
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  currentReservation?: Types.ObjectId | null;
}

export interface ITableDoc extends ITable, Document {
  _id: Types.ObjectId;
}

const TableSchema = new Schema<ITableDoc>(
  {
    number: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    currentReservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },
  },
  { timestamps: true }
);

export const Table = mongoose.model<ITableDoc>("Table", TableSchema);
