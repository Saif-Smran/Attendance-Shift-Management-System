import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  approveLeaveApplication,
  createLeaveApplication,
  getAllLeaveApplications,
  getMyLeaveApplications,
  rejectLeaveApplication
} from "./leave.service.js";

export const getMyLeaveApplicationsController = asyncHandler(async (req, res) => {
  const result = await getMyLeaveApplications(req.user?.id, req.query);
  return success(res, result, "My leave applications fetched");
});

export const createLeaveApplicationController = asyncHandler(async (req, res) => {
  const result = await createLeaveApplication(req.user?.id, req.body);
  return success(res, result, "Leave application submitted", 201);
});

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
