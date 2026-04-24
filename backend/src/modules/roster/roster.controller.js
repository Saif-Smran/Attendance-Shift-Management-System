import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import { assignRoster, deleteRoster, getMyRoster, getRoster } from "./roster.service.js";

export const getRosterController = asyncHandler(async (req, res) => {
  const result = await getRoster(req.query);
  return success(res, result, "Roster fetched");
});

export const getMyRosterController = asyncHandler(async (req, res) => {
  const result = await getMyRoster(req.user.id);
  return success(res, result, "My roster fetched");
});

export const assignRosterController = asyncHandler(async (req, res) => {
  const { userId, shiftId, dateRange } = req.body;
  const result = await assignRoster(userId, shiftId, dateRange || {});
  return success(res, result, "Roster assigned successfully", 201);
});

export const deleteRosterController = asyncHandler(async (req, res) => {
  const result = await deleteRoster(req.params.id);
  return success(res, result, "Roster deleted successfully");
});
