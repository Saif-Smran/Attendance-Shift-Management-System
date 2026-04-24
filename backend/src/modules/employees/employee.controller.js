import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  changeRole,
  changeStatus,
  createEmployee,
  deleteEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee
} from "./employee.service.js";

export const getAllEmployeesController = asyncHandler(async (req, res) => {
  const result = await getAllEmployees(req.query);
  return success(res, result, "Employees fetched");
});

export const createEmployeeController = asyncHandler(async (req, res) => {
  const result = await createEmployee(req.body);
  return success(res, result, "Employee created successfully", 201);
});

export const getEmployeeByIdController = asyncHandler(async (req, res) => {
  const result = await getEmployeeById(req.params.id);
  return success(res, result, "Employee fetched");
});

export const updateEmployeeController = asyncHandler(async (req, res) => {
  const result = await updateEmployee(req.params.id, req.body);
  return success(res, result, "Employee updated successfully");
});

export const deleteEmployeeController = asyncHandler(async (req, res) => {
  const result = await deleteEmployee(req.params.id);
  return success(res, result, "Employee deactivated successfully");
});

export const changeRoleController = asyncHandler(async (req, res) => {
  const role = req.body.newRole || req.body.role;
  const employeeCategory = req.body.employeeCategory;
  const result = await changeRole(req.params.id, role, employeeCategory);

  return success(res, result, "Employee role updated successfully");
});

export const changeStatusController = asyncHandler(async (req, res) => {
  const status = req.body.status;
  const result = await changeStatus(req.params.id, status);

  return success(res, result, "Employee status updated successfully");
});
