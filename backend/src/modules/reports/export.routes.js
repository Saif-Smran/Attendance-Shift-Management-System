import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { env } from "../../config/env.js";

import { exportExcelController, exportPDFController } from "./export.controller.js";

const exportRouter = Router();

// Timeout middleware for export endpoints
const exportTimeout = (req, res, next) => {
  req.setTimeout(env.EXPORT_TIMEOUT_MS);
  next();
};

exportRouter.use(authenticate);
exportRouter.use(authorize("ADMIN", "HR"));
exportRouter.use(exportTimeout);

exportRouter.get("/excel", exportExcelController);
exportRouter.get("/pdf", exportPDFController);

export default exportRouter;
