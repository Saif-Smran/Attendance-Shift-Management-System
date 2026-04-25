import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  updateDepartment
} from "./department.service.js";

export const getAllDepartmentsController = asyncHandler(async (req, res) => {
  const result = await getAllDepartments();
  return success(res, result, "Departments fetched");
});

export const createDepartmentController = asyncHandler(async (req, res) => {
  const result = await createDepartment(req.body);
  return success(res, result, "Department created", 201);
});

export const updateDepartmentController = asyncHandler(async (req, res) => {
  const result = await updateDepartment(req.params.id, req.body);
  return success(res, result, "Department updated");
});

export const deleteDepartmentController = asyncHandler(async (req, res) => {
  const result = await deleteDepartment(req.params.id);
  return success(res, result, "Department deleted");
});
