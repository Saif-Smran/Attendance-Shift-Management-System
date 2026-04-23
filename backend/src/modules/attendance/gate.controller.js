import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import { clockIn, clockOut } from "./gate.service.js";

export const clockInController = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;
  const result = await clockIn(employeeCode, password);

  if (result.alreadyClockedIn) {
    return success(res, result, result.message);
  }

  return success(res, result, "Clock-in successful");
});

export const clockOutController = asyncHandler(async (req, res) => {
  const { employeeCode, password } = req.body;
  const result = await clockOut(employeeCode, password);

  if (result.missingClockIn || result.alreadyCompleted) {
    return success(res, result, result.message);
  }

  return success(res, result, "Clock-out successful");
});
