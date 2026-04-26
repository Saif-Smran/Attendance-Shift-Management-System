import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

import { exportExcelController, exportPDFController } from "./export.controller.js";

const exportRouter = Router();

exportRouter.use(authenticate);
exportRouter.use(authorize("ADMIN", "HR"));

exportRouter.get("/excel", exportExcelController);
exportRouter.get("/pdf", exportPDFController);

export default exportRouter;
