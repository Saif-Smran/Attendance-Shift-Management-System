import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAttendanceReportController,
  getOTReportController,
  getRamadanReportController,
  getRosterComplianceReportController,
  getViolationsReportController
} from "./report.controller.js";

const reportRouter = Router();

reportRouter.use(authenticate);
reportRouter.use(authorize("ADMIN", "HR"));

reportRouter.get("/attendance", getAttendanceReportController);
reportRouter.get("/ot", getOTReportController);
reportRouter.get("/violations", getViolationsReportController);
reportRouter.get("/ramadan", getRamadanReportController);
reportRouter.get("/roster-compliance", getRosterComplianceReportController);

export default reportRouter;
