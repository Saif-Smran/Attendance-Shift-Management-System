import { Router } from "express";

import { clockInController, clockOutController } from "./gate.controller.js";

const gateRouter = Router();

gateRouter.post("/clockin", clockInController);
gateRouter.post("/clockout", clockOutController);

export default gateRouter;
