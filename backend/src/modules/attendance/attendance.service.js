import { prisma } from "../../config/db.js";

const ATTENDANCE_SELECT = {
  id: true,
  userId: true,
  date: true,
  clockIn: true,
  clockOut: true,
  status: true,
  lateMinutes: true,
  earlyExitMinutes: true,
  missedHours: true,
  otHours: true,
  sehriBreakApplied: true,
  iftarBreakApplied: true,
  isRamadan: true,
  flagged: true,
  flagReasons: true,
  ruleId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      employeeCode: true,
      name: true,
      role: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  rule: {
    select: {
      id: true,
      effectiveFrom: true
    }
  }
};

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const normalizeDate = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(String(value || ""));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDayBounds = (value) => {
  const start = normalizeDate(value);
  if (!start) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};

const parseMonth = (month) => {
  const raw = String(month || "").trim();
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(raw);

  if (!monthMatch) {
    return null;
  }

  const year = Number.parseInt(monthMatch[1], 10);
  const monthIndex = Number.parseInt(monthMatch[2], 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));

  return { start, end };
};

const sanitizeAttendance = (attendance) => ({
  id: attendance.id,
  userId: attendance.userId,
  employeeCode: attendance.user?.employeeCode || null,
  employeeName: attendance.user?.name || null,
  role: attendance.user?.role || null,
  departmentId: attendance.user?.departmentId || null,
  departmentName: attendance.user?.department?.name || null,
  date: attendance.date,
  clockIn: attendance.clockIn,
  clockOut: attendance.clockOut,
  status: attendance.status,
  lateMinutes: attendance.lateMinutes,
  earlyExitMinutes: attendance.earlyExitMinutes,
  missedHours: attendance.missedHours,
  otHours: attendance.otHours,
  sehriBreakApplied: attendance.sehriBreakApplied,
  iftarBreakApplied: attendance.iftarBreakApplied,
  isRamadan: attendance.isRamadan,
  flagged: attendance.flagged,
  flagReasons: attendance.flagReasons,
  ruleId: attendance.ruleId,
  ruleEffectiveFrom: attendance.rule?.effectiveFrom || null,
  createdAt: attendance.createdAt,
  updatedAt: attendance.updatedAt
});

const buildAttendanceFilter = (filters = {}, userId = null) => {
  const where = {};

  if (userId) {
    where.userId = userId;
  }

  const department = String(filters.department || "").trim();
  const employee = String(filters.employee || "").trim();

  if (department || employee) {
    where.user = {};

    if (department) {
      where.user.OR = [
        { departmentId: department },
        {
          department: {
            name: {
              contains: department,
              mode: "insensitive"
            }
          }
        }
      ];
    }

    if (employee) {
      where.user.AND = [
        {
          OR: [
            { id: employee },
            { employeeCode: { contains: employee, mode: "insensitive" } },
            { name: { contains: employee, mode: "insensitive" } }
          ]
        }
      ];
    }
  }

  if (filters.date) {
    const bounds = getDayBounds(filters.date);
    if (!bounds) {
      throw toError("Invalid date filter", 400);
    }

    where.date = {
      gte: bounds.start,
      lt: bounds.end
    };
  }

  return where;
};

const listAttendance = async (filters = {}, userId = null) => {
  const page = parsePositiveNumber(filters.page, 1);
  const limit = Math.min(parsePositiveNumber(filters.limit, 20), 100);
  const skip = (page - 1) * limit;
  const where = buildAttendanceFilter(filters, userId);

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      select: ATTENDANCE_SELECT,
      orderBy: [{ date: "desc" }, { user: { employeeCode: "asc" } }],
      take: limit,
      skip
    }),
    prisma.attendance.count({ where })
  ]);

  return {
    items: items.map(sanitizeAttendance),
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 1 : Math.ceil(total / limit)
    }
  };
};

export const getAttendance = async (filters = {}) => {
  return listAttendance(filters);
};

export const getMyAttendance = async (userId, filters = {}) => {
  return listAttendance(filters, userId);
};

export const getMySummary = async (userId, month) => {
  const range = parseMonth(month);

  if (!range) {
    throw toError("month must be in YYYY-MM format", 400);
  }

  const rows = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: range.start,
        lt: range.end
      }
    },
    select: {
      status: true,
      otHours: true
    }
  });

  let presentDays = 0;
  let lateDays = 0;
  let absentDays = 0;
  let earlyExitDays = 0;
  let otHours = 0;

  rows.forEach((row) => {
    if (row.status === "PRESENT") {
      presentDays += 1;
    }

    if (row.status === "LATE" || row.status === "EXCESSIVE_LATE") {
      lateDays += 1;
    }

    if (row.status === "ABSENT") {
      absentDays += 1;
    }

    if (row.status === "EARLY_EXIT" || row.status === "EARLY_EXIT_OVER_1HR") {
      earlyExitDays += 1;
    }

    otHours += Number(row.otHours || 0);
  });

  return {
    month,
    presentDays,
    lateDays,
    absentDays,
    earlyExitDays,
    otHours: Number(otHours.toFixed(2))
  };
};

export const getTodayAttendance = async () => {
  const start = normalizeDate(new Date());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [employees, attendanceRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: ["EMPLOYEE", "SECURITY"]
        },
        status: "ACTIVE"
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ employeeCode: "asc" }]
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lt: end
        }
      },
      select: ATTENDANCE_SELECT
    })
  ]);

  const attendanceByUserId = new Map();
  attendanceRows.forEach((row) => {
    attendanceByUserId.set(row.userId, row);
  });

  const items = employees.map((employee) => {
    const row = attendanceByUserId.get(employee.id);

    if (!row) {
      return {
        userId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employee.name,
        role: employee.role,
        departmentId: employee.departmentId,
        departmentName: employee.department?.name || null,
        status: "ABSENT",
        clockIn: null,
        clockOut: null,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        missedHours: 0,
        otHours: 0,
        flagged: false,
        flagReasons: []
      };
    }

    const attendance = sanitizeAttendance(row);

    return {
      userId: attendance.userId,
      employeeCode: attendance.employeeCode,
      employeeName: attendance.employeeName,
      role: attendance.role,
      departmentId: attendance.departmentId,
      departmentName: attendance.departmentName,
      status: attendance.status,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      lateMinutes: attendance.lateMinutes,
      earlyExitMinutes: attendance.earlyExitMinutes,
      missedHours: attendance.missedHours,
      otHours: attendance.otHours,
      flagged: attendance.flagged,
      flagReasons: attendance.flagReasons
    };
  });

  return {
    date: start,
    items
  };
};
