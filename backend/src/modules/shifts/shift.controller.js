import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import { createShift, deleteShift, getAllShifts, updateShift } from "./shift.service.js";

export const getAllShiftsController = asyncHandler(async (req, res) => {
  const result = await getAllShifts();
  return success(res, result, "Shifts fetched");
});

export const createShiftController = asyncHandler(async (req, res) => {
  const result = await createShift(req.body);
  return success(res, result, "Shift created successfully", 201);
});

export const updateShiftController = asyncHandler(async (req, res) => {
  const result = await updateShift(req.params.id, req.body);
  return success(res, result, "Shift updated successfully");
});

export const deleteShiftController = asyncHandler(async (req, res) => {
  const result = await deleteShift(req.params.id);
  return success(res, result, "Shift deleted successfully");
});
