import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAdminDashboardSummaryController,
  getHRDashboardSummaryController
} from "./dashboard.controller.js";

const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get("/admin", authorize("ADMIN"), getAdminDashboardSummaryController);
dashboardRouter.get("/hr", authorize("HR", "ADMIN"), getHRDashboardSummaryController);

export default dashboardRouter;
