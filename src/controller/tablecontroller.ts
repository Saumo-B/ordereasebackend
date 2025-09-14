// src/controllers/tableController.ts
import { Request, Response } from "express";
import { Table } from "../models/Table";
import { Reservation } from "../models/Reservation";

// GET all tables
export const getTables = async (req: Request, res: Response): Promise<void> => {
  try {
    const tables = await Table.find().populate("currentReservation");
    res.json(tables);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new table
export const createTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, capacity } = req.body;
    const table = new Table({ number, capacity });
    await table.save();
    res.status(201).json(table);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE table status
export const updateTableStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      res.status(404).json({ message: "Table not found" });
      return;
    }

    table.status = req.body.status || table.status;
    await table.save();
    res.json(table);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE table
export const deleteTable = async (req: Request, res: Response): Promise<void> => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: "Table deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// RESERVE a table
export const makeReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      res.status(404).json({ message: "Table not found" });
      return;
    }

    if (table.status !== "available") {
      res.status(400).json({ message: "Table not available" });
      return;
    }

    const { customerName, phone, time, partySize } = req.body;

    if (partySize > table.capacity) {
      res.status(400).json({ message: "Party size exceeds table capacity" });
      return;
    }

    const reservation = new Reservation({
      customerName,
      phone,
      time,
      partySize,
      table: table._id,
    });

    await reservation.save();

    table.status = "reserved";
    table.currentReservation = reservation._id;
    await table.save();

    res.status(201).json({ table, reservation });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
