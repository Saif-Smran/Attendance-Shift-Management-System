import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  approveLeaveApplication,
  getAllLeaveApplications,
  rejectLeaveApplication
} from "./leave.service.js";

export const getAllLeaveApplicationsController = asyncHandler(async (req, res) => {
  const result = await getAllLeaveApplications(req.query);
  return success(res, result, "Leave applications fetched");
});

export const approveLeaveApplicationController = asyncHandler(async (req, res) => {
  const result = await approveLeaveApplication(req.params.id, req.user?.id);
  return success(res, result, "Leave application approved");
});

export const rejectLeaveApplicationController = asyncHandler(async (req, res) => {
  const result = await rejectLeaveApplication(req.params.id, req.user?.id);
  return success(res, result, "Leave application rejected");
});
