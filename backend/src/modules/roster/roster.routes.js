import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  assignRosterController,
  deleteRosterController,
  getMyRosterController,
  getRosterController
} from "./roster.controller.js";

const rosterRouter = Router();

rosterRouter.use(authenticate);

rosterRouter.get("/me", getMyRosterController);
rosterRouter.get("/", authorize("ADMIN", "HR"), getRosterController);
rosterRouter.post("/", authorize("ADMIN", "HR"), assignRosterController);
rosterRouter.delete("/:id", authorize("ADMIN", "HR"), deleteRosterController);

export default rosterRouter;
