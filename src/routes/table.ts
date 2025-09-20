import { Router } from "express";
import {
  getTables,
  createTable,
  updateTableStatus,
  deleteTable,
  makeReservation,
} from "../controller/tablecontroller";

const router: Router = Router();

router.get("/", getTables);
router.post("/", createTable);
router.patch("/:id/status", updateTableStatus);
router.delete("/:id", deleteTable);
router.post("/:id/reserve", makeReservation);


export default router;
