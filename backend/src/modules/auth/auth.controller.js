import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  listDepartments,
  login,
  logout,
  refreshToken,
  register
} from "./auth.service.js";

export const loginController = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.employeeCode;
  const { password } = req.body;

  const result = await login(identifier, password);

  return success(res, result, "Login successful");
});

export const registerController = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    departmentId,
    requestedRole,
    requestedEmployeeCategory
  } = req.body;

  const result = await register({
    name,
    email,
    password,
    departmentId,
    requestedRole,
    requestedEmployeeCategory
  });

  return success(res, result, result.message, 201);
});

export const refreshController = asyncHandler(async (req, res) => {
  const token = req.body.token || req.body.refreshToken;
  const result = await refreshToken(token);

  return success(res, result, "Access token refreshed");
});

export const logoutController = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const result = await logout(userId);

  return success(res, result, result.message);
});

export const listDepartmentsController = asyncHandler(async (req, res) => {
  const departments = await listDepartments();

  return success(res, departments, "Departments fetched");
});
