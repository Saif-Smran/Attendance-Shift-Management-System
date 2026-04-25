import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  createDepartmentController,
  deleteDepartmentController,
  getAllDepartmentsController,
  updateDepartmentController
} from "./department.controller.js";

const departmentRouter = Router();

departmentRouter.use(authenticate);

departmentRouter.get("/", authorize("ADMIN", "HR"), getAllDepartmentsController);
departmentRouter.post("/", authorize("ADMIN"), createDepartmentController);
departmentRouter.put("/:id", authorize("ADMIN"), updateDepartmentController);
departmentRouter.delete("/:id", authorize("ADMIN"), deleteDepartmentController);

export default departmentRouter;
