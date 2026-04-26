import { prisma } from "../../config/db.js";

const VIOLATION_STATUSES = new Set([
  "LATE",
  "EXCESSIVE_LATE",
  "EARLY_EXIT",
  "EARLY_EXIT_OVER_1HR"
]);

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeDate = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(String(value || ""));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDateRange = (from, to) => {
  const fromDate = from ? normalizeDate(from) : null;
  const toDate = to ? normalizeDate(to) : null;

  if (from && !fromDate) {
    throw toError("Invalid from date", 400);
  }

  if (to && !toDate) {
    throw toError("Invalid to date", 400);
  }

  if (!fromDate && !toDate) {
    return null;
  }

  const start = fromDate || toDate;
  const endStart = toDate || fromDate;

  if (endStart < start) {
    throw toError("to date must be after or equal to from date", 400);
  }

  const endExclusive = new Date(endStart);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    gte: start,
    lt: endExclusive
  };
};

const parseMonthRange = (month) => {
  const raw = String(month || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);

  if (!match) {
    throw toError("month must be in YYYY-MM format", 400);
  }

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    throw toError("month must be in YYYY-MM format", 400);
  }

  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

  return { start, end };
};

const buildUserFilter = ({ departmentId, employeeId } = {}) => {
  const userWhere = {};

  if (departmentId) {
    userWhere.departmentId = String(departmentId).trim();
  }

  if (employeeId) {
    userWhere.id = String(employeeId).trim();
  }

  return Object.keys(userWhere).length > 0 ? userWhere : undefined;
};

const attendanceSelect = {
  id: true,
  date: true,
  clockIn: true,
  clockOut: true,
  status: true,
  lateMinutes: true,
  earlyExitMinutes: true,
  missedHours: true,
  otHours: true,
  flagReasons: true,
  sehriBreakApplied: true,
  iftarBreakApplied: true,
  isRamadan: true,
  user: {
    select: {
      id: true,
      name: true,
      employeeCode: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
};

export const getAttendanceReport = async ({ departmentId, employeeId, from, to } = {}) => {
  const where = {};
  const userWhere = buildUserFilter({ departmentId, employeeId });
  const dateRange = parseDateRange(from, to);

  if (userWhere) {
    where.user = userWhere;
  }

  if (dateRange) {
    where.date = dateRange;
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: attendanceSelect,
    orderBy: [{ date: "desc" }, { user: { employeeCode: "asc" } }]
  });

  return rows.map((row) => ({
    name: row.user?.name || null,
    code: row.user?.employeeCode || null,
    department: row.user?.department?.name || null,
    date: row.date,
    clockIn: row.clockIn,
    clockOut: row.clockOut,
    status: row.status,
    lateMinutes: row.lateMinutes,
    otHours: Number(row.otHours || 0),
    missedHours: Number(row.missedHours || 0),
    flagReasons: row.flagReasons || []
  }));
};

export const getOTReport = async ({ departmentId, month } = {}) => {
  const range = parseMonthRange(month);
  const where = {
    date: {
      gte: range.start,
      lt: range.end
    }
  };

  const userWhere = buildUserFilter({ departmentId });
  if (userWhere) {
    where.user = userWhere;
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: {
      otHours: true,
      user: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  const map = new Map();

  rows.forEach((row) => {
    if (!row.user) {
      return;
    }

    const key = row.user.id;
    const current = map.get(key) || {
      name: row.user.name,
      code: row.user.employeeCode,
      department: row.user.department?.name || null,
      totalOTHours: 0
    };

    current.totalOTHours += Number(row.otHours || 0);
    map.set(key, current);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      totalOTHours: Number(item.totalOTHours.toFixed(2))
    }))
    .sort((left, right) => right.totalOTHours - left.totalOTHours);
};

export const getViolationsReport = async ({ departmentId, from, to } = {}) => {
  const where = {
    status: {
      in: Array.from(VIOLATION_STATUSES)
    }
  };

  const userWhere = buildUserFilter({ departmentId });
  const dateRange = parseDateRange(from, to);

  if (userWhere) {
    where.user = userWhere;
  }

  if (dateRange) {
    where.date = dateRange;
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: attendanceSelect,
    orderBy: [{ date: "desc" }, { user: { employeeCode: "asc" } }]
  });

  return rows.map((row) => ({
    name: row.user?.name || null,
    code: row.user?.employeeCode || null,
    department: row.user?.department?.name || null,
    date: row.date,
    violationType: row.status,
    minutes:
      row.status === "LATE" || row.status === "EXCESSIVE_LATE"
        ? row.lateMinutes
        : row.earlyExitMinutes,
    missedHours: Number(row.missedHours || 0),
    lateMinutes: row.lateMinutes,
    earlyExitMinutes: row.earlyExitMinutes
  }));
};

export const getRamadanReport = async ({ from, to } = {}) => {
  const where = {
    isRamadan: true
  };

  const dateRange = parseDateRange(from, to);
  if (dateRange) {
    where.date = dateRange;
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: attendanceSelect,
    orderBy: [{ date: "desc" }, { user: { employeeCode: "asc" } }]
  });

  return rows.map((row) => ({
    name: row.user?.name || null,
    code: row.user?.employeeCode || null,
    department: row.user?.department?.name || null,
    date: row.date,
    clockIn: row.clockIn,
    clockOut: row.clockOut,
    status: row.status,
    sehriBreakApplied: row.sehriBreakApplied,
    iftarBreakApplied: row.iftarBreakApplied,
    lateMinutes: row.lateMinutes,
    otHours: Number(row.otHours || 0)
  }));
};

export const getRosterComplianceReport = async () => {
  const today = normalizeDate(new Date());

  const employees = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: {
        in: ["EMPLOYEE", "SECURITY"]
      }
    },
    select: {
      id: true,
      name: true,
      employeeCode: true,
      department: {
        select: {
          name: true
        }
      },
      rosters: {
        where: {
          date: {
            lte: today
          }
        },
        select: {
          date: true
        },
        orderBy: {
          date: "desc"
        }
      }
    },
    orderBy: {
      employeeCode: "asc"
    }
  });

  return employees.map((employee) => {
    let consecutiveDays = 0;
    const rosterDateSet = new Set(
      employee.rosters.map((item) => {
        const date = normalizeDate(item.date);
        if (!date) {
          return null;
        }

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`;
      })
    );

    const cursor = new Date(today);

    while (true) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate()
      ).padStart(2, "0")}`;

      if (!rosterDateSet.has(key)) {
        break;
      }

      consecutiveDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    let status = "OK";
    if (consecutiveDays >= 14) {
      status = "EXCEEDED";
    } else if (consecutiveDays >= 12) {
      status = "WARNING";
    }

    return {
      name: employee.name,
      code: employee.employeeCode,
      department: employee.department?.name || null,
      consecutiveDays,
      status
    };
  });
};
