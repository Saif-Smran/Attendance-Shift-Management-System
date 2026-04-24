import { prisma } from "../../config/db.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeDate = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const formatDateKey = (value) => {
  const date = normalizeDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const dateFromKey = (key) => {
  const date = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const buildDateRange = (startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (!start || !end) {
    throw toError("Invalid startDate or endDate", 400);
  }

  if (end < start) {
    throw toError("endDate must be after or equal to startDate", 400);
  }

  const dates = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const getMaxConsecutiveFromKeys = (keys) => {
  if (!keys.length) {
    return 0;
  }

  const sorted = [...new Set(keys)].sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = dateFromKey(sorted[index - 1]);
    const current = dateFromKey(sorted[index]);
    const diff = current.getTime() - previous.getTime();

    if (diff === ONE_DAY_MS) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

const getStreakForDate = (keysSet, targetKey) => {
  if (!keysSet.has(targetKey)) {
    return 0;
  }

  let streak = 1;
  const target = dateFromKey(targetKey);

  const backward = new Date(target);
  while (true) {
    backward.setUTCDate(backward.getUTCDate() - 1);
    const key = backward.toISOString().slice(0, 10);

    if (!keysSet.has(key)) {
      break;
    }

    streak += 1;
  }

  const forward = new Date(target);
  while (true) {
    forward.setUTCDate(forward.getUTCDate() + 1);
    const key = forward.toISOString().slice(0, 10);

    if (!keysSet.has(key)) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const sanitizeRoster = (roster, streakDays = 0) => ({
  id: roster.id,
  userId: roster.userId,
  employeeCode: roster.user?.employeeCode || null,
  employeeName: roster.user?.name || null,
  departmentId: roster.user?.departmentId || null,
  departmentName: roster.user?.department?.name || null,
  shiftId: roster.shiftId,
  shiftName: roster.shift?.name || null,
  shiftType: roster.shift?.type || null,
  date: roster.date,
  isRamadan: roster.isRamadan,
  consecutiveDays: streakDays,
  nearLimitWarning: streakDays >= 12
});

const ensureUserAndShift = async (userId, shiftId) => {
  const [user, shift] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    }),
    prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true }
    })
  ]);

  if (!user || !["EMPLOYEE", "SECURITY"].includes(user.role)) {
    throw toError("Employee user not found", 404);
  }

  if (!shift) {
    throw toError("Shift not found", 404);
  }
};

export const getRoster = async (filters = {}) => {
  const dateFilter = filters.date ? normalizeDate(filters.date) : null;
  const startDateFilter = filters.startDate ? normalizeDate(filters.startDate) : null;
  const endDateFilter = filters.endDate ? normalizeDate(filters.endDate) : null;

  const where = {};

  if (startDateFilter && endDateFilter) {
    if (endDateFilter < startDateFilter) {
      throw toError("endDate must be after or equal to startDate", 400);
    }

    const end = new Date(endDateFilter);
    end.setUTCDate(end.getUTCDate() + 1);

    where.date = {
      gte: startDateFilter,
      lt: end
    };
  } else if (dateFilter) {
    const start = new Date(dateFilter);
    const end = new Date(dateFilter);
    end.setUTCDate(end.getUTCDate() + 1);

    where.date = {
      gte: start,
      lt: end
    };
  }

  if (filters.department) {
    const department = String(filters.department).trim();
    where.user = {
      OR: [
        { departmentId: department },
        {
          department: {
            name: {
              contains: department,
              mode: "insensitive"
            }
          }
        }
      ]
    };
  }

  const rosters = await prisma.roster.findMany({
    where,
    include: {
      shift: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: [{ date: "asc" }, { user: { employeeCode: "asc" } }]
  });

  const rosterByUser = new Map();
  rosters.forEach((entry) => {
    if (!rosterByUser.has(entry.userId)) {
      rosterByUser.set(entry.userId, []);
    }
    rosterByUser.get(entry.userId).push(entry);
  });

  const items = [];
  rosterByUser.forEach((userRosters) => {
    const keySet = new Set(userRosters.map((entry) => formatDateKey(entry.date)));

    userRosters.forEach((entry) => {
      const key = formatDateKey(entry.date);
      items.push(sanitizeRoster(entry, getStreakForDate(keySet, key)));
    });
  });

  return {
    items
  };
};

export const getMyRoster = async (userId) => {
  const rosters = await prisma.roster.findMany({
    where: { userId },
    include: {
      shift: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: [{ date: "asc" }]
  });

  const keySet = new Set(rosters.map((entry) => formatDateKey(entry.date)));

  return {
    items: rosters.map((entry) =>
      sanitizeRoster(
        {
          ...entry,
          user: {
            id: userId
          }
        },
        getStreakForDate(keySet, formatDateKey(entry.date))
      )
    )
  };
};

export const assignRoster = async (userId, shiftId, dateRange = {}) => {
  const dates = buildDateRange(dateRange.startDate, dateRange.endDate);

  await ensureUserAndShift(userId, shiftId);

  const existingRosters = await prisma.roster.findMany({
    where: { userId },
    select: {
      date: true
    },
    orderBy: { date: "asc" }
  });

  const existingDateKeys = new Set(existingRosters.map((item) => formatDateKey(item.date)));
  const pendingDateKeys = [];

  for (const date of dates) {
    const key = formatDateKey(date);

    if (existingDateKeys.has(key)) {
      throw toError(`Roster already exists for ${key}`, 409);
    }

    const keysForValidation = [
      ...Array.from(existingDateKeys.values()),
      ...pendingDateKeys,
      key
    ];

    const maxConsecutive = getMaxConsecutiveFromKeys(keysForValidation);

    if (maxConsecutive > 14) {
      throw toError("Max 14 consecutive roster days", 400);
    }

    pendingDateKeys.push(key);
  }

  const created = [];

  for (const key of pendingDateKeys) {
    const date = dateFromKey(key);

    const roster = await prisma.roster.create({
      data: {
        userId,
        shiftId,
        date,
        isRamadan: false
      },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    existingDateKeys.add(key);
    const streak = getStreakForDate(existingDateKeys, key);

    created.push(sanitizeRoster(roster, streak));
  }

  return {
    created,
    warning: created.some((entry) => entry.nearLimitWarning)
      ? "Employee is at 12+ consecutive days"
      : null
  };
};

export const deleteRoster = async (id) => {
  const existing = await prisma.roster.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    throw toError("Roster not found", 404);
  }

  await prisma.roster.delete({
    where: { id }
  });

  return {
    id
  };
};
