import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  approveLeaveApplicationController,
  createLeaveApplicationController,
  getAllLeaveApplicationsController,
  getMyLeaveApplicationsController,
  rejectLeaveApplicationController
} from "./leave.controller.js";

const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.get("/me", authorize("EMPLOYEE", "SECURITY"), getMyLeaveApplicationsController);
leaveRouter.post("/", authorize("EMPLOYEE", "SECURITY"), createLeaveApplicationController);
leaveRouter.get("/", authorize("ADMIN", "HR"), getAllLeaveApplicationsController);
leaveRouter.put("/:id/approve", authorize("ADMIN", "HR"), approveLeaveApplicationController);
leaveRouter.put("/:id/reject", authorize("ADMIN", "HR"), rejectLeaveApplicationController);

export default leaveRouter;
