import asyncHandler from "../../utils/asyncHandler.js";
import { success } from "../../utils/apiResponse.js";

import { createRule, getActiveRule, updateRule } from "./rule.service.js";

export const getActiveRuleController = asyncHandler(async (req, res) => {
  const result = await getActiveRule();
  return success(res, result, "Active rule fetched");
});

export const createRuleController = asyncHandler(async (req, res) => {
  const result = await createRule(req.body, req.user?.id);
  return success(res, result, "Rule created successfully", 201);
});

export const updateRuleController = asyncHandler(async (req, res) => {
  const result = await updateRule(req.params.id, req.body, req.user?.id);
  return success(res, result, "Rule updated successfully");
});
