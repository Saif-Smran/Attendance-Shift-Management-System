import { prisma } from "../../config/db.js";

const SHIFT_TYPE_SET = new Set([
  "GENERAL_DAY",
  "RAMADAN_DAY",
  "NIGHT",
  "RAMADAN_NIGHT",
  "SECURITY_DAY",
  "SECURITY_NIGHT",
  "FRIDAY"
]);

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

const sanitizeShift = (shift) => ({
  id: shift.id,
  name: shift.name,
  type: shift.type,
  startTime: shift.startTime,
  endTime: shift.endTime,
  breakDurationMinutes: shift.breakDurationMinutes,
  createdAt: shift.createdAt,
  updatedAt: shift.updatedAt
});

const validateShiftPayload = (data = {}, { allowPartial = false } = {}) => {
  const payload = {};

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, "name")) {
    const name = String(data.name || "").trim();
    if (!name) {
      throw toError("Shift name is required", 400);
    }
    payload.name = name;
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, "type")) {
    const type = String(data.type || "").trim().toUpperCase();
    if (!SHIFT_TYPE_SET.has(type)) {
      throw toError("Invalid shift type", 400);
    }
    payload.type = type;
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, "startTime")) {
    const startTime = String(data.startTime || "").trim();
    if (!TIME_REGEX.test(startTime)) {
      throw toError("startTime must be in HH:MM format", 400);
    }
    payload.startTime = startTime;
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, "endTime")) {
    const endTime = String(data.endTime || "").trim();
    if (!TIME_REGEX.test(endTime)) {
      throw toError("endTime must be in HH:MM format", 400);
    }
    payload.endTime = endTime;
  }

  if (!allowPartial || Object.prototype.hasOwnProperty.call(data, "breakDurationMinutes")) {
    const breakDurationMinutes = toInt(data.breakDurationMinutes);
    if (breakDurationMinutes === null || breakDurationMinutes < 0 || breakDurationMinutes > 240) {
      throw toError("breakDurationMinutes must be between 0 and 240", 400);
    }
    payload.breakDurationMinutes = breakDurationMinutes;
  }

  return payload;
};

export const getAllShifts = async () => {
  const shifts = await prisma.shift.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }]
  });

  return {
    items: shifts.map(sanitizeShift)
  };
};

export const createShift = async (data = {}) => {
  const payload = validateShiftPayload(data);

  const shift = await prisma.shift.create({
    data: payload
  });

  return sanitizeShift(shift);
};

export const updateShift = async (id, data = {}) => {
  const existing = await prisma.shift.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw toError("Shift not found", 404);
  }

  const payload = validateShiftPayload(data, { allowPartial: true });

  if (Object.keys(payload).length === 0) {
    throw toError("No shift fields provided for update", 400);
  }

  const shift = await prisma.shift.update({
    where: { id },
    data: payload
  });

  return sanitizeShift(shift);
};

export const deleteShift = async (id) => {
  const existing = await prisma.shift.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          users: true,
          rosters: true
        }
      }
    }
  });

  if (!existing) {
    throw toError("Shift not found", 404);
  }

  if (existing._count.users > 0 || existing._count.rosters > 0) {
    throw toError("Shift is in use and cannot be deleted", 409);
  }

  await prisma.shift.delete({
    where: { id }
  });

  return {
    id
  };
};
