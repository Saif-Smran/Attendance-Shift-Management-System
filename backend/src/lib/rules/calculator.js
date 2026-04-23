const toMinutes = (start, end) => {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
};

const roundHours = (minutes) => {
  return Number((Math.max(0, minutes) / 60).toFixed(2));
};

const buildDateAtTime = (date, timeValue) => {
  if (!timeValue) {
    return null;
  }

  const [hoursPart, minutesPart] = String(timeValue).split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  const output = new Date(date);
  output.setHours(hours, minutes, 0, 0);
  return output;
};

const isTimeInRange = (date, startTime, endTime) => {
  const rangeStart = buildDateAtTime(date, startTime);
  const rangeEnd = buildDateAtTime(date, endTime);

  if (!rangeStart || !rangeEnd) {
    return false;
  }

  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  const startMinute = rangeStart.getHours() * 60 + rangeStart.getMinutes();
  const endMinute = rangeEnd.getHours() * 60 + rangeEnd.getMinutes();

  if (endMinute < startMinute) {
    return minuteOfDay >= startMinute || minuteOfDay <= endMinute;
  }

  return minuteOfDay >= startMinute && minuteOfDay <= endMinute;
};

const resolveStatus = ({
  lateMinutes,
  earlyExitMinutes,
  lateThresholdMinutes,
  excessiveLateAfterMinutes,
  earlyExitFlagStartMinutes,
  earlyExitFlagEndMinutes
}) => {
  let status = "PRESENT";

  if (lateMinutes > lateThresholdMinutes + excessiveLateAfterMinutes) {
    status = "EXCESSIVE_LATE";
  } else if (lateMinutes > lateThresholdMinutes) {
    status = "LATE";
  }

  if (earlyExitMinutes >= earlyExitFlagStartMinutes) {
    return "EARLY_EXIT_OVER_1HR";
  }

  if (earlyExitMinutes >= earlyExitFlagEndMinutes) {
    if (status === "EXCESSIVE_LATE") {
      return "EXCESSIVE_LATE";
    }

    return "EARLY_EXIT";
  }

  return status;
};

export const calculateAttendance = ({
  clockIn,
  clockOut,
  shiftStart,
  shiftEnd,
  rule,
  isRamadan,
  userRole
}) => {
  if (!clockIn || !clockOut) {
    return {
      status: "ABSENT",
      lateMinutes: 0,
      earlyExitMinutes: 0,
      missedHours: 0,
      otHours: 0,
      flagged: true,
      flagReasons: ["INCOMPLETE_ATTENDANCE"],
      sehriBreakApplied: false,
      iftarBreakApplied: false
    };
  }

  const ruleValues = {
    lateThresholdMinutes: rule?.lateThresholdMinutes ?? 15,
    excessiveLateAfterMinutes: rule?.excessiveLateAfterMinutes ?? 15,
    earlyExitFlagStartMinutes: rule?.earlyExitFlagStartMinutes ?? 60,
    earlyExitFlagEndMinutes: rule?.earlyExitFlagEndMinutes ?? 30,
    securityOT: rule?.securityOT ?? false,
    otMethod: rule?.otMethod ?? "AFTER_8_HOURS",
    sehriStart: rule?.sehriStart,
    sehriEnd: rule?.sehriEnd,
    iftarConflictStart: rule?.iftarConflictStart,
    iftarConflictEnd: rule?.iftarConflictEnd
  };

  const clockInDate = new Date(clockIn);
  const clockOutDate = new Date(clockOut);

  const shiftStartDate = buildDateAtTime(clockInDate, shiftStart);
  const shiftEndDate = buildDateAtTime(clockInDate, shiftEnd);

  if (shiftStartDate && shiftEndDate && shiftEndDate <= shiftStartDate) {
    shiftEndDate.setDate(shiftEndDate.getDate() + 1);
  }

  const workedMinutes = toMinutes(clockInDate, clockOutDate);
  const scheduledMinutes =
    shiftStartDate && shiftEndDate ? toMinutes(shiftStartDate, shiftEndDate) : 8 * 60;

  const lateMinutes = shiftStartDate ? toMinutes(shiftStartDate, clockInDate) : 0;
  const earlyExitMinutes = shiftEndDate ? toMinutes(clockOutDate, shiftEndDate) : 0;

  const status = resolveStatus({
    lateMinutes,
    earlyExitMinutes,
    lateThresholdMinutes: ruleValues.lateThresholdMinutes,
    excessiveLateAfterMinutes: ruleValues.excessiveLateAfterMinutes,
    earlyExitFlagStartMinutes: ruleValues.earlyExitFlagStartMinutes,
    earlyExitFlagEndMinutes: ruleValues.earlyExitFlagEndMinutes
  });

  const missedMinutes = Math.max(0, scheduledMinutes - workedMinutes);
  const otMinutesByRule =
    ruleValues.otMethod === "AFTER_8_HOURS" ? Math.max(0, workedMinutes - 8 * 60) : 0;
  const otMinutes =
    userRole === "SECURITY" && !ruleValues.securityOT ? 0 : otMinutesByRule;

  const sehriBreakApplied = Boolean(
    isRamadan &&
      ruleValues.sehriStart &&
      ruleValues.sehriEnd &&
      isTimeInRange(clockInDate, ruleValues.sehriStart, ruleValues.sehriEnd)
  );

  const iftarBreakApplied = Boolean(
    isRamadan &&
      ruleValues.iftarConflictStart &&
      ruleValues.iftarConflictEnd &&
      isTimeInRange(
        clockOutDate,
        ruleValues.iftarConflictStart,
        ruleValues.iftarConflictEnd
      )
  );

  const flagReasons = [];

  if (status === "EXCESSIVE_LATE") {
    flagReasons.push("EXCESSIVE_LATE");
  }

  if (status === "EARLY_EXIT") {
    flagReasons.push("EARLY_EXIT");
  }

  if (status === "EARLY_EXIT_OVER_1HR") {
    flagReasons.push("EARLY_EXIT_OVER_1HR");
  }

  if (sehriBreakApplied) {
    flagReasons.push("SEHRI_WINDOW");
  }

  if (iftarBreakApplied) {
    flagReasons.push("IFTAR_WINDOW");
  }

  return {
    status,
    lateMinutes,
    earlyExitMinutes,
    missedHours: roundHours(missedMinutes),
    otHours: roundHours(otMinutes),
    flagged: flagReasons.length > 0,
    flagReasons,
    sehriBreakApplied,
    iftarBreakApplied
  };
};
