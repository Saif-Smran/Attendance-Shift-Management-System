import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import { getAdminDashboardSummary, getHRDashboardSummary } from "./dashboard.service.js";

export const getAdminDashboardSummaryController = asyncHandler(async (req, res) => {
  const result = await getAdminDashboardSummary();
  return success(res, result, "Admin dashboard summary fetched");
});

export const getHRDashboardSummaryController = asyncHandler(async (req, res) => {
  const result = await getHRDashboardSummary();
  return success(res, result, "HR dashboard summary fetched");
});
