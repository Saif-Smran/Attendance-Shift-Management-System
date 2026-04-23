import bcrypt from "bcryptjs";

import { prisma } from "../../config/db.js";
import { calculateAttendance } from "../../lib/rules/calculator.js";

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const isDateInRange = (value, start, end) => {
  if (!value || !start || !end) {
    return false;
  }

  const valueDate = new Date(value);
  const startDate = new Date(start);
  const endDate = new Date(end);

  return valueDate >= startDate && valueDate <= endDate;
};

const resolveIsRamadan = (rule, date) => {
  if (!rule?.ramadanActive) {
    return false;
  }

  if (rule.ramadanStartDate && rule.ramadanEndDate) {
    return isDateInRange(date, rule.ramadanStartDate, rule.ramadanEndDate);
  }

  return true;
};

const getActiveRule = async (date) => {
  const activeRule = await prisma.attendanceRule.findFirst({
    where: {
      effectiveFrom: {
        lte: date
      }
    },
    orderBy: {
      effectiveFrom: "desc"
    }
  });

  if (activeRule) {
    return activeRule;
  }

  return prisma.attendanceRule.create({
    data: {}
  });
};

const validateGateUser = async (employeeCode, password) => {
  const normalizedEmployeeCode = String(employeeCode || "").trim().toUpperCase();

  if (!normalizedEmployeeCode || !password) {
    throw toError("Employee ID and password are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: {
      employeeCode: normalizedEmployeeCode
    }
  });

  if (!user) {
    throw toError("Invalid employee ID or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw toError("Invalid employee ID or password", 401);
  }

  if (user.status === "PENDING") {
    throw toError("Registration pending approval", 403);
  }

  if (user.status === "INACTIVE") {
    throw toError("Account deactivated", 403);
  }

  return user;
};

const getRosterShiftForDate = async (userId, date) => {
  return prisma.roster.findUnique({
    where: {
      userId_date: {
        userId,
        date
      }
    },
    include: {
      shift: true
    }
  });
};

export const clockIn = async (employeeCode, password) => {
  const user = await validateGateUser(employeeCode, password);
  const today = startOfToday();

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today
      }
    }
  });

  if (existingAttendance?.clockIn) {
    return {
      alreadyClockedIn: true,
      employeeName: user.name,
      action: "Clocked In",
      timestamp: existingAttendance.clockIn,
      message: "Already clocked in"
    };
  }

  const now = new Date();
  const activeRule =
    existingAttendance?.ruleId
      ? await prisma.attendanceRule.findUnique({ where: { id: existingAttendance.ruleId } })
      : await getActiveRule(now);

  const isRamadan = resolveIsRamadan(activeRule, now);

  let attendance;

  if (existingAttendance) {
    attendance = await prisma.attendance.update({
      where: {
        id: existingAttendance.id
      },
      data: {
        clockIn: now,
        isRamadan,
        ruleId: activeRule.id,
        status: "PRESENT",
        flagged: false,
        flagReasons: [],
        lateMinutes: 0,
        earlyExitMinutes: 0,
        missedHours: 0,
        otHours: 0,
        sehriBreakApplied: false,
        iftarBreakApplied: false
      }
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        clockIn: now,
        status: "PRESENT",
        lateMinutes: 0,
        earlyExitMinutes: 0,
        missedHours: 0,
        otHours: 0,
        sehriBreakApplied: false,
        iftarBreakApplied: false,
        isRamadan,
        flagged: false,
        flagReasons: [],
        ruleId: activeRule.id
      }
    });
  }

  return {
    employeeName: user.name,
    action: "Clocked In",
    timestamp: attendance.clockIn
  };
};

export const clockOut = async (employeeCode, password) => {
  const user = await validateGateUser(employeeCode, password);
  const today = startOfToday();

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today
      }
    }
  });

  if (!existingAttendance?.clockIn) {
    return {
      missingClockIn: true,
      message: "No clock-in found"
    };
  }

  if (existingAttendance.clockOut) {
    return {
      alreadyCompleted: true,
      employeeName: user.name,
      action: "Clocked Out",
      timestamp: existingAttendance.clockOut,
      message: "Already completed today"
    };
  }

  const now = new Date();

  const [rule, roster] = await Promise.all([
    prisma.attendanceRule.findUnique({
      where: {
        id: existingAttendance.ruleId
      }
    }),
    getRosterShiftForDate(user.id, today)
  ]);

  const activeRule = rule || (await getActiveRule(now));
  const isRamadan = existingAttendance.isRamadan || resolveIsRamadan(activeRule, now);

  const calculated = calculateAttendance({
    clockIn: existingAttendance.clockIn,
    clockOut: now,
    shiftStart: roster?.shift?.startTime,
    shiftEnd: roster?.shift?.endTime,
    rule: activeRule,
    isRamadan,
    userRole: user.role
  });

  const updatedAttendance = await prisma.attendance.update({
    where: {
      id: existingAttendance.id
    },
    data: {
      clockOut: now,
      status: calculated.status,
      lateMinutes: calculated.lateMinutes,
      earlyExitMinutes: calculated.earlyExitMinutes,
      missedHours: calculated.missedHours,
      otHours: calculated.otHours,
      flagged: calculated.flagged,
      flagReasons: calculated.flagReasons,
      sehriBreakApplied: calculated.sehriBreakApplied,
      iftarBreakApplied: calculated.iftarBreakApplied,
      isRamadan,
      ruleId: activeRule.id
    }
  });

  return {
    employeeName: user.name,
    action: "Clocked Out",
    timestamp: updatedAttendance.clockOut,
    summary: {
      status: updatedAttendance.status,
      lateMinutes: updatedAttendance.lateMinutes,
      earlyExitMinutes: updatedAttendance.earlyExitMinutes,
      missedHours: updatedAttendance.missedHours,
      otHours: updatedAttendance.otHours,
      flagged: updatedAttendance.flagged
    }
  };
};
