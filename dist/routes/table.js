"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tablecontroller_1 = require("../controller/tablecontroller");
const router = (0, express_1.Router)();
router.get("/", tablecontroller_1.getTables);
router.post("/", tablecontroller_1.createTable);
router.patch("/:id/status", tablecontroller_1.updateTableStatus);
router.delete("/:id", tablecontroller_1.deleteTable);
router.post("/:id/reserve", tablecontroller_1.makeReservation);
exports.default = router;
//# sourceMappingURL=table.js.map