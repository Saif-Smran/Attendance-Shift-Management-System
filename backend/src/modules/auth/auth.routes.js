import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";

import {
  listDepartmentsController,
  loginController,
  logoutController,
  refreshController,
  registerController
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.post("/register", registerController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", authenticate, logoutController);
authRouter.get("/departments", listDepartmentsController);

export default authRouter;
