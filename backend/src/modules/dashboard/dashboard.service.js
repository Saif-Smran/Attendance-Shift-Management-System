import { prisma } from "../../config/db.js";

const LATE_STATUSES = new Set(["LATE", "EXCESSIVE_LATE"]);
const PRESENT_STATUSES = new Set([
  "PRESENT",
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

const getIsoDayKey = (value) => {
  const date = normalizeDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const getWeekBounds = (baseDate = new Date()) => {
  const start = normalizeDate(baseDate);

  if (!start) {
    throw toError("Invalid date for week range", 400);
  }

  const currentDay = start.getUTCDay();
  const offset = currentDay === 0 ? -6 : 1 - currentDay;
  start.setUTCDate(start.getUTCDate() + offset);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return { start, end };
};

const buildWeekDays = (startDate) => {
  const days = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = new Date(startDate);
    day.setUTCDate(day.getUTCDate() + dayIndex);

    days.push({
      date: day,
      dayLabel: day.toLocaleDateString("en-BD", {
        weekday: "short",
        timeZone: "UTC"
      })
    });
  }

  return days;
};

const getEmployeeBreakdown = (users = []) => {
  const breakdown = {
    workers: 0,
    staff: 0,
    security: 0,
    hr: 0
  };

  users.forEach((user) => {
    if (user.role === "EMPLOYEE") {
      if (user.employeeCategory === "STAFF") {
        breakdown.staff += 1;
      } else {
        breakdown.workers += 1;
      }
      return;
    }

    if (user.role === "SECURITY") {
      breakdown.security += 1;
      return;
    }

    if (user.role === "HR") {
      breakdown.hr += 1;
    }
  });

  return breakdown;
};

const getFlaggedEvents = (attendanceRows = []) => {
  return attendanceRows
    .filter((row) => row.flagged)
    .map((row) => ({
      id: row.id,
      employeeId: row.userId,
      employeeCode: row.user?.employeeCode || "-",
      employeeName: row.user?.name || "Unknown",
      flagReason:
        row.flagReasons?.length > 0
          ? row.flagReasons.join(", ")
          : "Flagged attendance event",
      time: row.clockOut || row.clockIn || row.updatedAt || row.createdAt
    }))
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime());
};

const getTodayOperationalAttendanceStats = (attendanceRows = [], activeEmployeeMap = new Map()) => {
  let presentCount = 0;
  let lateCount = 0;

  attendanceRows.forEach((row) => {
    if (!activeEmployeeMap.has(row.userId)) {
      return;
    }

    if (PRESENT_STATUSES.has(row.status)) {
      presentCount += 1;
    }

    if (LATE_STATUSES.has(row.status)) {
      lateCount += 1;
    }
  });

  return {
    presentCount,
    lateCount
  };
};

export const getAdminDashboardSummary = async () => {
  const todayBounds = getDayBounds(new Date());

  const [activeUsers, departments, attendanceRows, pendingRegistrations] = await Promise.all([
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: {
          in: ["EMPLOYEE", "SECURITY", "HR"]
        }
      },
      select: {
        id: true,
        role: true,
        employeeCategory: true,
        departmentId: true
      }
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: todayBounds.start,
          lt: todayBounds.end
        }
      },
      select: {
        id: true,
        userId: true,
        status: true,
        flagged: true,
        flagReasons: true,
        clockIn: true,
        clockOut: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            role: true,
            departmentId: true
          }
        }
      }
    }),
    prisma.registration.count({
      where: {
        status: "PENDING"
      }
    })
  ]);

  const breakdown = getEmployeeBreakdown(activeUsers);
  const totalEmployees = breakdown.workers + breakdown.staff + breakdown.security + breakdown.hr;

  const operationalUsers = activeUsers.filter((user) => user.role === "EMPLOYEE" || user.role === "SECURITY");
  const operationalUserMap = new Map(operationalUsers.map((user) => [user.id, user]));

  const { presentCount, lateCount } = getTodayOperationalAttendanceStats(
    attendanceRows,
    operationalUserMap
  );

  const presentPercentage =
    operationalUsers.length === 0 ? 0 : Number(((presentCount / operationalUsers.length) * 100).toFixed(1));

  const attendanceByDepartmentId = new Map();

  attendanceRows.forEach((row) => {
    const user = row.user;

    if (!user || !operationalUserMap.has(user.id) || !PRESENT_STATUSES.has(row.status)) {
      return;
    }

    if (!user.departmentId) {
      return;
    }

    const current = attendanceByDepartmentId.get(user.departmentId) || 0;
    attendanceByDepartmentId.set(user.departmentId, current + 1);
  });

  const departmentAttendance = departments.map((department) => ({
    departmentId: department.id,
    departmentName: department.name,
    presentCount: attendanceByDepartmentId.get(department.id) || 0
  }));

  const flaggedEvents = getFlaggedEvents(attendanceRows);

  return {
    generatedAt: new Date(),
    totalEmployees,
    breakdown,
    presentToday: {
      count: presentCount,
      percentage: presentPercentage,
      totalOperational: operationalUsers.length
    },
    lateToday: {
      count: lateCount
    },
    pendingRegistrations: {
      count: pendingRegistrations
    },
    departmentAttendance,
    flaggedEvents
  };
};

export const getHRDashboardSummary = async () => {
  const todayBounds = getDayBounds(new Date());
  const weekBounds = getWeekBounds(new Date());
  const weekDays = buildWeekDays(weekBounds.start);

  const [activeOperationalUsers, attendanceTodayRows, attendanceWeekRows, pendingRegistrations, pendingLeaveApplications, recentLeaveApplications] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          status: "ACTIVE",
          role: {
            in: ["EMPLOYEE", "SECURITY"]
          }
        },
        select: {
          id: true
        }
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: todayBounds.start,
            lt: todayBounds.end
          }
        },
        select: {
          id: true,
          userId: true,
          status: true,
          flagged: true
        }
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: weekBounds.start,
            lt: weekBounds.end
          }
        },
        select: {
          id: true,
          userId: true,
          date: true,
          status: true
        }
      }),
      prisma.registration.count({
        where: {
          status: "PENDING"
        }
      }),
      prisma.leaveApplication.count({
        where: {
          status: "PENDING"
        }
      }),
      prisma.leaveApplication.findMany({
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              employeeCode: true,
              name: true
            }
          }
        },
        take: 8
      })
    ]);

  const activeOperationalUserMap = new Map(activeOperationalUsers.map((user) => [user.id, true]));

  const { presentCount } = getTodayOperationalAttendanceStats(
    attendanceTodayRows,
    activeOperationalUserMap
  );

  const flaggedAttendanceToday = attendanceTodayRows.filter(
    (row) => activeOperationalUserMap.has(row.userId) && row.flagged
  ).length;

  const rowsByDate = new Map();

  attendanceWeekRows.forEach((row) => {
    if (!activeOperationalUserMap.has(row.userId)) {
      return;
    }

    const dateKey = getIsoDayKey(row.date);

    if (!dateKey) {
      return;
    }

    const list = rowsByDate.get(dateKey) || [];
    list.push(row);
    rowsByDate.set(dateKey, list);
  });

  const weeklyTrend = weekDays.map((weekDay) => {
    const dateKey = getIsoDayKey(weekDay.date);
    const rows = rowsByDate.get(dateKey) || [];

    let present = 0;
    let late = 0;

    rows.forEach((row) => {
      if (LATE_STATUSES.has(row.status)) {
        late += 1;
        return;
      }

      if (row.status === "PRESENT" || row.status === "EARLY_EXIT" || row.status === "EARLY_EXIT_OVER_1HR") {
        present += 1;
      }
    });

    const absent = Math.max(activeOperationalUsers.length - rows.length, 0);

    return {
      date: weekDay.date,
      dayLabel: weekDay.dayLabel,
      present,
      late,
      absent
    };
  });

  return {
    generatedAt: new Date(),
    pendingRegistrations: {
      count: pendingRegistrations
    },
    pendingLeaveApplications: {
      count: pendingLeaveApplications
    },
    presentToday: {
      count: presentCount,
      totalOperational: activeOperationalUsers.length
    },
    flaggedAttendanceToday: {
      count: flaggedAttendanceToday
    },
    weeklyTrend,
    recentLeaveApplications: recentLeaveApplications.map((leaveApplication) => ({
      id: leaveApplication.id,
      employeeId: leaveApplication.userId,
      employeeCode: leaveApplication.user?.employeeCode || null,
      employeeName: leaveApplication.user?.name || "Unknown",
      fromDate: leaveApplication.fromDate,
      toDate: leaveApplication.toDate,
      reason: leaveApplication.reason,
      status: leaveApplication.status,
      createdAt: leaveApplication.createdAt
    }))
  };
};
