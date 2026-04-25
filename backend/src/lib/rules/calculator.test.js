import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateAttendance, checkRosterLimit } from "./calculator.js";

const baseShift = {
  id: "shift-1",
  type: "GENERAL_DAY",
  startTime: "08:00",
  endTime: "16:00"
};

const baseRule = {
  tiffinBreakMinutes: 60,
  iftarTime: "22:00",
  sehriStart: "04:00",
  sehriEnd: "05:00",
  iftarConflictStart: "05:30",
  iftarConflictEnd: "06:30"
};

const at = (value) => {
  const utc = new Date(value);
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
    utc.getUTCMilliseconds()
  );
};

describe("calculateAttendance", () => {
  it("1) on-time in and out returns PRESENT with 0 OT", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:00:00.000Z"),
      clockOut: at("2026-04-01T16:00:00.000Z"),
      shift: baseShift,
      rule: baseRule,
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.status, "PRESENT");
    assert.equal(result.lateMinutes, 0);
    assert.equal(result.earlyExitMinutes, 0);
    assert.equal(result.otHours, 0);
  });

  it("2) clock-in 10 minutes late returns LATE", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:10:00.000Z"),
      clockOut: at("2026-04-01T16:00:00.000Z"),
      shift: baseShift,
      rule: baseRule,
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.status, "LATE");
    assert.equal(result.lateMinutes, 10);
  });

  it("3) clock-in 20 minutes late returns EXCESSIVE_LATE", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:20:00.000Z"),
      clockOut: at("2026-04-01T16:00:00.000Z"),
      shift: baseShift,
      rule: baseRule,
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.status, "EXCESSIVE_LATE");
    assert.equal(result.lateMinutes, 20);
  });

  it("4) clock-out 45 minutes early returns EARLY_EXIT", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:00:00.000Z"),
      clockOut: at("2026-04-01T15:15:00.000Z"),
      shift: baseShift,
      rule: baseRule,
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.status, "EARLY_EXIT");
    assert.equal(result.earlyExitMinutes, 45);
    assert.equal(result.flagged, true);
  });

  it("5) clock-out 90 minutes early returns EARLY_EXIT_OVER_1HR", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:00:00.000Z"),
      clockOut: at("2026-04-01T14:30:00.000Z"),
      shift: baseShift,
      rule: baseRule,
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.status, "EARLY_EXIT_OVER_1HR");
    assert.equal(result.earlyExitMinutes, 90);
    assert.equal(result.missedHours, 1.5);
  });

  it("6) 10-hour work window returns 2 OT hours", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:00:00.000Z"),
      clockOut: at("2026-04-01T18:00:00.000Z"),
      shift: {
        ...baseShift,
        endTime: "18:00"
      },
      rule: {
        ...baseRule,
        tiffinBreakMinutes: 0
      },
      isRamadan: false,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.otHours, 2);
  });

  it("7) SECURITY role always gets 0 OT", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T08:00:00.000Z"),
      clockOut: at("2026-04-01T20:00:00.000Z"),
      shift: {
        ...baseShift,
        endTime: "20:00"
      },
      rule: {
        ...baseRule,
        tiffinBreakMinutes: 0
      },
      isRamadan: false,
      employeeRole: "SECURITY"
    });

    assert.equal(result.otHours, 0);
  });

  it("8) Ramadan night shift applies sehri+iftar breaks and OT stays correct", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T20:00:00.000Z"),
      clockOut: at("2026-04-02T07:00:00.000Z"),
      shift: {
        id: "shift-night",
        type: "RAMADAN_NIGHT",
        startTime: "20:00",
        endTime: "06:00"
      },
      rule: {
        ...baseRule,
        tiffinBreakMinutes: 60,
        iftarTime: "22:00"
      },
      isRamadan: true,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.sehriBreakApplied, true);
    assert.equal(result.iftarBreakApplied, true);
    assert.equal(result.otHours, 0);
  });

  it("9) Ramadan day shift still calculates OT after 8 effective hours", () => {
    const result = calculateAttendance({
      clockIn: at("2026-04-01T06:00:00.000Z"),
      clockOut: at("2026-04-01T16:00:00.000Z"),
      shift: {
        id: "shift-rd",
        type: "RAMADAN_DAY",
        startTime: "08:00",
        endTime: "16:00"
      },
      rule: {
        ...baseRule,
        tiffinBreakMinutes: 60
      },
      isRamadan: true,
      employeeRole: "EMPLOYEE"
    });

    assert.equal(result.otHours, 1);
  });
});

describe("checkRosterLimit", () => {
  it("10) returns exceeded for 14 consecutive days ending yesterday", async () => {
    const baseDate = at("2026-04-15T00:00:00.000Z");
    const rows = [];

    for (let index = 0; index < 14; index += 1) {
      const date = new Date(baseDate);
      date.setUTCDate(date.getUTCDate() - 1 - index);
      rows.push({ date });
    }

    const prismaMock = {
      roster: {
        findMany: async () => rows
      }
    };

    const result = await checkRosterLimit("user-1", baseDate, prismaMock);

    assert.equal(result.exceeded, true);
    assert.equal(result.consecutiveDays, 14);
  });
});
