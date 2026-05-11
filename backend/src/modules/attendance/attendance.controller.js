import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  getAttendance,
  markAbsentForDate,
  getMyAttendance,
  getMySummary,
  getTodayAttendance
} from "./attendance.service.js";

export const getAttendanceController = asyncHandler(async (req, res) => {
  const result = await getAttendance(req.query);
  return success(res, result, "Attendance fetched");
});

export const getMyAttendanceController = asyncHandler(async (req, res) => {
  const result = await getMyAttendance(req.user.id, req.query);
  return success(res, result, "My attendance fetched");
});

export const getMySummaryController = asyncHandler(async (req, res) => {
  const result = await getMySummary(req.user.id, req.query.month);
  return success(res, result, "My attendance summary fetched");
});

export const getTodayAttendanceController = asyncHandler(async (req, res) => {
  const result = await getTodayAttendance();
  return success(res, result, "Today's attendance fetched");
});

export const markAbsentForDateController = asyncHandler(async (req, res) => {
  const date = req.body?.date || req.query?.date;
  const result = await markAbsentForDate(date || new Date());
  return success(res, result, "Absent attendance marked successfully");
});
