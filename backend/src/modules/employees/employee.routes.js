import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  changeRoleController,
  changeStatusController,
  createEmployeeController,
  deleteEmployeeController,
  getAllEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController
} from "./employee.controller.js";

const employeeRouter = Router();

employeeRouter.use(authenticate);

employeeRouter.get("/", authorize("ADMIN", "HR"), getAllEmployeesController);
employeeRouter.post("/", authorize("ADMIN"), createEmployeeController);
employeeRouter.get("/:id", authorize("ADMIN", "HR"), getEmployeeByIdController);
employeeRouter.put("/:id", authorize("ADMIN", "HR"), updateEmployeeController);
employeeRouter.delete("/:id", authorize("ADMIN"), deleteEmployeeController);
employeeRouter.put("/:id/role", authorize("ADMIN"), changeRoleController);
employeeRouter.put("/:id/status", authorize("ADMIN"), changeStatusController);

export default employeeRouter;
