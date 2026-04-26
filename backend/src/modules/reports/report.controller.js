import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  getAttendanceReport,
  getOTReport,
  getRamadanReport,
  getRosterComplianceReport,
  getViolationsReport
} from "./report.service.js";

export const getAttendanceReportController = asyncHandler(async (req, res) => {
  const data = await getAttendanceReport(req.query);
  return success(res, data, "Attendance report fetched");
});

export const getOTReportController = asyncHandler(async (req, res) => {
  const data = await getOTReport(req.query);
  return success(res, data, "OT report fetched");
});

export const getViolationsReportController = asyncHandler(async (req, res) => {
  const data = await getViolationsReport(req.query);
  return success(res, data, "Violations report fetched");
});

export const getRamadanReportController = asyncHandler(async (req, res) => {
  const data = await getRamadanReport(req.query);
  return success(res, data, "Ramadan report fetched");
});

export const getRosterComplianceReportController = asyncHandler(async (req, res) => {
  const data = await getRosterComplianceReport();
  return success(res, data, "Roster compliance report fetched");
});
