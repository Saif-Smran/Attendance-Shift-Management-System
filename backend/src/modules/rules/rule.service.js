import { prisma } from "../../config/db.js";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const sanitizeRule = (rule) => ({
  id: rule.id,
  lateThresholdMinutes: rule.lateThresholdMinutes,
  excessiveLateAfterMinutes: rule.excessiveLateAfterMinutes,
  tiffinBreakMinutes: rule.tiffinBreakMinutes,
  earlyExitFlagStartMinutes: rule.earlyExitFlagStartMinutes,
  earlyExitFlagEndMinutes: rule.earlyExitFlagEndMinutes,
  maxRosterDays: rule.maxRosterDays,
  securityOT: rule.securityOT,
  otMethod: rule.otMethod,
  ramadanActive: rule.ramadanActive,
  ramadanStartDate: rule.ramadanStartDate,
  ramadanEndDate: rule.ramadanEndDate,
  iftarTime: rule.iftarTime,
  sehriStart: rule.sehriStart,
  sehriEnd: rule.sehriEnd,
  iftarConflictStart: rule.iftarConflictStart,
  iftarConflictEnd: rule.iftarConflictEnd,
  effectiveFrom: rule.effectiveFrom,
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
  updatedById: rule.updatedById,
  updatedBy: rule.updatedBy
    ? {
        id: rule.updatedBy.id,
        name: rule.updatedBy.name,
        employeeCode: rule.updatedBy.employeeCode,
        role: rule.updatedBy.role
      }
    : null
});

const ruleSelect = {
  id: true,
  lateThresholdMinutes: true,
  excessiveLateAfterMinutes: true,
  tiffinBreakMinutes: true,
  earlyExitFlagStartMinutes: true,
  earlyExitFlagEndMinutes: true,
  maxRosterDays: true,
  securityOT: true,
  otMethod: true,
  ramadanActive: true,
  ramadanStartDate: true,
  ramadanEndDate: true,
  iftarTime: true,
  sehriStart: true,
  sehriEnd: true,
  iftarConflictStart: true,
  iftarConflictEnd: true,
  effectiveFrom: true,
  createdAt: true,
  updatedAt: true,
  updatedById: true,
  updatedBy: {
    select: {
      id: true,
      name: true,
      employeeCode: true,
      role: true
    }
  }
};

const validateRuleData = (data = {}, { partial = false } = {}) => {
  const payload = {};

  const assignInt = (key, min = 0, max = 720) => {
    if (partial && !Object.prototype.hasOwnProperty.call(data, key)) {
      return;
    }

    const value = toInt(data[key]);
    if (value === null || value < min || value > max) {
      throw toError(`${key} must be between ${min} and ${max}`, 400);
    }

    payload[key] = value;
  };

  assignInt("lateThresholdMinutes", 0, 180);
  assignInt("excessiveLateAfterMinutes", 0, 180);
  assignInt("tiffinBreakMinutes", 0, 240);
  assignInt("earlyExitFlagStartMinutes", 0, 180);
  assignInt("earlyExitFlagEndMinutes", 0, 180);
  assignInt("maxRosterDays", 1, 31);

  if (!partial || Object.prototype.hasOwnProperty.call(data, "ramadanActive")) {
    payload.ramadanActive = Boolean(data.ramadanActive);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "ramadanStartDate")) {
    if (data.ramadanStartDate) {
      const date = toDate(data.ramadanStartDate);
      if (!date) {
        throw toError("Invalid ramadanStartDate", 400);
      }
      payload.ramadanStartDate = date;
    } else {
      payload.ramadanStartDate = null;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(data, "ramadanEndDate")) {
    if (data.ramadanEndDate) {
      const date = toDate(data.ramadanEndDate);
      if (!date) {
        throw toError("Invalid ramadanEndDate", 400);
      }
      payload.ramadanEndDate = date;
    } else {
      payload.ramadanEndDate = null;
    }
  }

  const assignTime = (key, { nullable = false } = {}) => {
    if (partial && !Object.prototype.hasOwnProperty.call(data, key)) {
      return;
    }

    const value = data[key];

    if ((value === null || value === "") && nullable) {
      payload[key] = null;
      return;
    }

    const asString = String(value || "").trim();
    if (!TIME_REGEX.test(asString)) {
      throw toError(`${key} must be in HH:MM format`, 400);
    }

    payload[key] = asString;
  };

  assignTime("iftarTime", { nullable: true });
  assignTime("sehriStart");
  assignTime("sehriEnd");
  assignTime("iftarConflictStart");
  assignTime("iftarConflictEnd");

  if (!partial || Object.prototype.hasOwnProperty.call(data, "effectiveFrom")) {
    if (data.effectiveFrom) {
      const effectiveFrom = toDate(data.effectiveFrom);
      if (!effectiveFrom) {
        throw toError("Invalid effectiveFrom", 400);
      }
      payload.effectiveFrom = effectiveFrom;
    }
  }

  if (
    payload.ramadanStartDate &&
    payload.ramadanEndDate &&
    payload.ramadanEndDate < payload.ramadanStartDate
  ) {
    throw toError("ramadanEndDate must be after ramadanStartDate", 400);
  }

  if (
    Number.isFinite(payload.earlyExitFlagStartMinutes) &&
    Number.isFinite(payload.earlyExitFlagEndMinutes) &&
    payload.earlyExitFlagStartMinutes < payload.earlyExitFlagEndMinutes
  ) {
    throw toError("earlyExitFlagStartMinutes must be greater than or equal to earlyExitFlagEndMinutes", 400);
  }

  return payload;
};

export const getActiveRule = async () => {
  const rule = await prisma.attendanceRule.findFirst({
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    select: ruleSelect
  });

  return rule ? sanitizeRule(rule) : null;
};

export const createRule = async (data = {}, updatedById) => {
  const payload = validateRuleData(data, { partial: false });

  const rule = await prisma.attendanceRule.create({
    data: {
      ...payload,
      otMethod: "AFTER_8_HOURS",
      securityOT: false,
      updatedById: updatedById || null
    },
    select: ruleSelect
  });

  return sanitizeRule(rule);
};

export const updateRule = async (id, data = {}, updatedById) => {
  const existing = await prisma.attendanceRule.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw toError("Rule not found", 404);
  }

  const payload = validateRuleData(data, { partial: true });

  if (Object.keys(payload).length === 0) {
    throw toError("No rule fields provided for update", 400);
  }

  const rule = await prisma.attendanceRule.update({
    where: { id },
    data: {
      ...payload,
      otMethod: "AFTER_8_HOURS",
      securityOT: false,
      updatedById: updatedById || null
    },
    select: ruleSelect
  });

  return sanitizeRule(rule);
};
