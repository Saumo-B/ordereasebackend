"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeReservation = exports.deleteTable = exports.updateTableStatus = exports.createTable = exports.getTables = void 0;
const Table_1 = require("../models/Table");
const Reservation_1 = require("../models/Reservation");
// GET all tables
const getTables = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tables = yield Table_1.Table.find().populate("currentReservation");
        res.json(tables);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.getTables = getTables;
// CREATE a new table
const createTable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { number, capacity } = req.body;
        const table = new Table_1.Table({ number, capacity });
        yield table.save();
        res.status(201).json(table);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.createTable = createTable;
// UPDATE table status
const updateTableStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const table = yield Table_1.Table.findById(req.params.id);
        if (!table) {
            res.status(404).json({ message: "Table not found" });
            return;
        }
        table.status = req.body.status || table.status;
        yield table.save();
        res.json(table);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.updateTableStatus = updateTableStatus;
// DELETE table
const deleteTable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Table_1.Table.findByIdAndDelete(req.params.id);
        res.json({ message: "Table deleted" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.deleteTable = deleteTable;
// RESERVE a table
const makeReservation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const table = yield Table_1.Table.findById(req.params.id);
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
        const reservation = new Reservation_1.Reservation({
            customerName,
            phone,
            time,
            partySize,
            table: table._id,
        });
        yield reservation.save();
        table.status = "reserved";
        table.currentReservation = reservation._id;
        yield table.save();
        res.status(201).json({ table, reservation });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
exports.makeReservation = makeReservation;
//# sourceMappingURL=tablecontroller.js.map