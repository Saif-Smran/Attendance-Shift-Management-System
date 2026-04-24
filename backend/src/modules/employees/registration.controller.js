import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  approveRegistration,
  getAllRegistrations,
  rejectRegistration
} from "./registration.service.js";

export const getAllRegistrationsController = asyncHandler(async (req, res) => {
  const result = await getAllRegistrations(req.query);
  return success(res, result, "Registrations fetched");
});

export const approveRegistrationController = asyncHandler(async (req, res) => {
  const result = await approveRegistration(req.params.id, req.user?.id);
  return success(res, result, "Registration approved");
});

export const rejectRegistrationController = asyncHandler(async (req, res) => {
  const result = await rejectRegistration(req.params.id, req.user?.id, req.body.reason);
  return success(res, result, "Registration rejected");
});
