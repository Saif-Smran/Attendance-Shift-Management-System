const MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const minutesBetween = (start, end) =>
  Math.round((end.getTime() - start.getTime()) / MINUTE_MS);

const toHours = (minutes) => Number((Math.max(0, minutes) / 60).toFixed(2));

const parseTime = (value) => {
  const [hoursPart, minutesPart] = String(value || "").split(":");
  const hours = Number.parseInt(hoursPart, 10);
  const minutes = Number.parseInt(minutesPart, 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
};

const asDateAtTime = (baseDate, hhmm) => {
  const parsed = parseTime(hhmm);

  if (!parsed) {
    return null;
  }

  const date = new Date(baseDate);
  date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date;
};

const normalizeShiftWindow = (clockInDate, shift) => {
  const shiftStart = asDateAtTime(clockInDate, shift?.startTime);
  const shiftEnd = asDateAtTime(clockInDate, shift?.endTime);

  if (!shiftStart || !shiftEnd) {
    return {
      shiftStart: null,
      shiftEnd: null
    };
  }

  if (shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  return {
    shiftStart,
    shiftEnd
  };
};

const resolveTimeInsideShiftWindow = (shiftStart, shiftEnd, hhmm) => {
  const candidate = asDateAtTime(shiftStart, hhmm);

  if (!candidate) {
    return null;
  }

  while (candidate < shiftStart) {
    candidate.setDate(candidate.getDate() + 1);
  }

  if (candidate > shiftEnd) {
    return null;
  }

  return candidate;
};

const overlapMinutes = (startA, endA, startB, endB) => {
  const overlapStart = Math.max(startA.getTime(), startB.getTime());
  const overlapEnd = Math.min(endA.getTime(), endB.getTime());
  return Math.max(0, Math.round((overlapEnd - overlapStart) / MINUTE_MS));
};

const statusPriority = [
  "EARLY_EXIT_OVER_1HR",
  "EXCESSIVE_LATE",
  "EARLY_EXIT",
  "LATE",
  "PRESENT"
];

const resolveFinalStatus = (lateStatus, earlyStatus) =>
  statusPriority.find((status) => status === earlyStatus || status === lateStatus) ||
  "PRESENT";

export const calculateAttendance = ({
  clockIn,
  clockOut,
  shift,
  rule,
  isRamadan,
  employeeRole
}) => {
  if (!(clockIn instanceof Date) || Number.isNaN(clockIn.getTime())) {
    throw new Error("clockIn must be a valid Date object");
  }

  if (!(clockOut instanceof Date) || Number.isNaN(clockOut.getTime())) {
    throw new Error("clockOut must be a valid Date object");
  }

  const { shiftStart, shiftEnd } = normalizeShiftWindow(clockIn, shift);

  let lateMinutes = 0;
  let lateStatus = "PRESENT";

  if (shiftStart) {
    const diffMinutes = minutesBetween(shiftStart, clockIn);

    if (diffMinutes > 0 && diffMinutes <= 15) {
      lateMinutes = diffMinutes;
      lateStatus = "LATE";
    } else if (diffMinutes > 15) {
      lateMinutes = diffMinutes;
      lateStatus = "EXCESSIVE_LATE";
    }
  }

  let earlyExitMinutes = 0;
  let missedHours = 0;
  let earlyStatus = "PRESENT";
  let flagged = false;
  const flagReasons = [];

  if (shiftEnd) {
    const diffMinutes = minutesBetween(clockOut, shiftEnd);

    if (diffMinutes >= 30 && diffMinutes <= 60) {
      earlyExitMinutes = diffMinutes;
      earlyStatus = "EARLY_EXIT";
      flagged = true;
      flagReasons.push(`Early exit: left ${diffMinutes} minutes before shift end`);
    } else if (diffMinutes > 60) {
      earlyExitMinutes = diffMinutes;
      missedHours = toHours(diffMinutes);
      earlyStatus = "EARLY_EXIT_OVER_1HR";
      flagged = true;
      flagReasons.push(`Left over 1 hour early, missed ${missedHours} hours`);
    }
  }

  let breakMinutes = Number(rule?.tiffinBreakMinutes ?? 60);
  let sehriBreakApplied = false;
  let iftarBreakApplied = false;

  const shiftType = String(shift?.type || "").toUpperCase();

  if (isRamadan && shiftStart && shiftEnd) {
    if (shiftType === "NIGHT" || shiftType === "RAMADAN_NIGHT") {
      sehriBreakApplied = true;
      breakMinutes += 60;

      const iftarDate = resolveTimeInsideShiftWindow(shiftStart, shiftEnd, rule?.iftarTime);
      if (iftarDate) {
        let iftarMinutes = 60;

        const conflictStart = resolveTimeInsideShiftWindow(
          shiftStart,
          shiftEnd,
          rule?.iftarConflictStart
        );
        const conflictEnd = resolveTimeInsideShiftWindow(
          shiftStart,
          shiftEnd,
          rule?.iftarConflictEnd
        );

        if (
          conflictStart &&
          conflictEnd &&
          iftarDate.getTime() >= conflictStart.getTime() &&
          iftarDate.getTime() <= conflictEnd.getTime()
        ) {
          const iftarStart = new Date(iftarDate);
          const iftarEnd = new Date(iftarDate.getTime() + 60 * MINUTE_MS);

          const sehriStart = resolveTimeInsideShiftWindow(shiftStart, shiftEnd, rule?.sehriStart);
          const sehriEnd = resolveTimeInsideShiftWindow(shiftStart, shiftEnd, rule?.sehriEnd);

          if (sehriStart && sehriEnd) {
            iftarMinutes -= overlapMinutes(iftarStart, iftarEnd, sehriStart, sehriEnd);
          }

          const minutesUntilShiftEnd = Math.max(0, minutesBetween(iftarStart, shiftEnd));
          iftarMinutes = Math.min(iftarMinutes, minutesUntilShiftEnd);
        }

        iftarMinutes = Math.max(0, Math.min(60, iftarMinutes));
        if (iftarMinutes > 0) {
          iftarBreakApplied = true;
          breakMinutes += iftarMinutes;
        }
      }
    }

    if (shiftType === "SECURITY_DAY") {
      iftarBreakApplied = true;
      breakMinutes += 60;
    }

    if (shiftType === "SECURITY_NIGHT") {
      sehriBreakApplied = true;
      breakMinutes += 60;
    }
  }

  let otHours = 0;
  if (employeeRole !== "SECURITY") {
    const totalMinutes = Math.max(0, minutesBetween(clockIn, clockOut));
    const effectiveWork = totalMinutes - breakMinutes;
    const standardWork = 8 * 60;

    if (effectiveWork > standardWork) {
      otHours = toHours(effectiveWork - standardWork);
    }
  }

  const status = resolveFinalStatus(lateStatus, earlyStatus);

  return {
    status,
    lateMinutes,
    earlyExitMinutes,
    missedHours,
    otHours,
    sehriBreakApplied,
    iftarBreakApplied,
    flagged,
    flagReasons
  };
};

export const checkRosterLimit = async (userId, date, prismaClient) => {
  const inputDate = new Date(date);
  if (Number.isNaN(inputDate.getTime())) {
    throw new Error("date must be a valid date value");
  }

  const day = new Date(inputDate);
  day.setUTCHours(0, 0, 0, 0);

  const previousDay = new Date(day.getTime() - ONE_DAY_MS);

  const rows = await prismaClient.roster.findMany({
    where: {
      userId,
      date: {
        lte: previousDay
      }
    },
    select: {
      date: true
    },
    orderBy: {
      date: "desc"
    }
  });

  let consecutiveDays = 0;
  let cursor = previousDay.getTime();

  for (const row of rows) {
    const rowDate = new Date(row.date);
    rowDate.setUTCHours(0, 0, 0, 0);

    const rowTime = rowDate.getTime();

    if (rowTime === cursor) {
      consecutiveDays += 1;
      cursor -= ONE_DAY_MS;
      continue;
    }

    if (rowTime < cursor) {
      break;
    }
  }

  return {
    exceeded: consecutiveDays >= 14,
    consecutiveDays
  };
};
