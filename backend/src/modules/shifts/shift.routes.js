import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  createShiftController,
  deleteShiftController,
  getAllShiftsController,
  updateShiftController
} from "./shift.controller.js";

const shiftRouter = Router();

shiftRouter.use(authenticate);

shiftRouter.get("/", getAllShiftsController);
shiftRouter.post("/", authorize("ADMIN", "HR"), createShiftController);
shiftRouter.put("/:id", authorize("ADMIN", "HR"), updateShiftController);
shiftRouter.delete("/:id", authorize("ADMIN", "HR"), deleteShiftController);

export default shiftRouter;
