import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  approveRegistrationController,
  getAllRegistrationsController,
  rejectRegistrationController
} from "./registration.controller.js";

const registrationRouter = Router();

registrationRouter.use(authenticate);

registrationRouter.get("/", authorize("ADMIN", "HR"), getAllRegistrationsController);
registrationRouter.put("/:id/approve", authorize("ADMIN", "HR"), approveRegistrationController);
registrationRouter.put("/:id/reject", authorize("ADMIN", "HR"), rejectRegistrationController);
registrationRouter.patch("/:id/approve", authorize("ADMIN", "HR"), approveRegistrationController);
registrationRouter.patch("/:id/reject", authorize("ADMIN", "HR"), rejectRegistrationController);

export default registrationRouter;
