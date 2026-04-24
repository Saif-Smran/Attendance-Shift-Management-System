import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import {
  createRuleController,
  getActiveRuleController,
  updateRuleController
} from "./rule.controller.js";

const ruleRouter = Router();

ruleRouter.use(authenticate);

ruleRouter.get("/", getActiveRuleController);
ruleRouter.post("/", authorize("ADMIN", "HR"), createRuleController);
ruleRouter.put("/:id", authorize("ADMIN", "HR"), updateRuleController);

export default ruleRouter;
