import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  getAttendanceController,
  getMyAttendanceController,
  getMySummaryController,
  getTodayAttendanceController
} from "./attendance.controller.js";

const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.get("/me/summary", getMySummaryController);
attendanceRouter.get("/me", getMyAttendanceController);
attendanceRouter.get("/today", authorize("ADMIN", "HR"), getTodayAttendanceController);
attendanceRouter.get("/", authorize("ADMIN", "HR"), getAttendanceController);

export default attendanceRouter;
