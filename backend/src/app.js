import cors from "cors";
import express from "express";
import cron from "node-cron";

import { prisma } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis, getRedisClient } from "./config/redis.js";
import { authenticate } from "./middlewares/authenticate.js";
import { authorize } from "./middlewares/authorize.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from "./modules/auth/auth.routes.js";
import attendanceRouter from "./modules/attendance/attendance.routes.js";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
import departmentRouter from "./modules/departments/department.routes.js";
import gateRouter from "./modules/attendance/gate.routes.js";
import employeeRouter from "./modules/employees/employee.routes.js";
import leaveRouter from "./modules/leaves/leave.routes.js";
import exportRouter from "./modules/reports/export.routes.js";
import registrationRouter from "./modules/employees/registration.routes.js";
import reportRouter from "./modules/reports/report.routes.js";
import rosterRouter from "./modules/roster/roster.routes.js";
import ruleRouter from "./modules/rules/rule.routes.js";
import shiftRouter from "./modules/shifts/shift.routes.js";
import { markAbsentForDate } from "./modules/attendance/attendance.service.js";
import { success } from "./utils/apiResponse.js";

const app = express();

if (env.ABSENCE_AUTO_MARK_ENABLED && env.NODE_ENV !== "test") {
  const isValidCron = cron.validate(env.ABSENCE_AUTO_MARK_CRON);

  if (!isValidCron) {
    console.error(
      `[AttendanceScheduler] Invalid cron expression: ${env.ABSENCE_AUTO_MARK_CRON}. Scheduler is disabled.`
    );
  } else {
    cron.schedule(
      env.ABSENCE_AUTO_MARK_CRON,
      async () => {
        try {
          const result = await markAbsentForDate(new Date());
          console.log(
            `[AttendanceScheduler] Marked absences for ${result.date.toISOString().slice(0, 10)}. Newly marked: ${result.newlyMarked}, already marked: ${result.alreadyMarked}.`
          );
        } catch (error) {
          console.error("[AttendanceScheduler] Failed to auto-mark absences:", error);
        }
      },
      {
        timezone: env.ABSENCE_AUTO_MARK_TIMEZONE
      }
    );

    console.log(
      `[AttendanceScheduler] Enabled with cron '${env.ABSENCE_AUTO_MARK_CRON}' in timezone '${env.ABSENCE_AUTO_MARK_TIMEZONE}'.`
    );
  }
}

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  return success(
    res,
    {
      service: "Ha-Meem Attendance & Shift Management API",
      status: "UP"
    },
    "Server is healthy"
  );
});

app.get("/health/ready", async (req, res) => {
  const checks = {
    db: false,
    redis: false
  };
  const issues = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch (error) {
    issues.db = error.message;
  }

  try {
    let redisClient = getRedisClient();
    if (!redisClient?.isOpen) {
      redisClient = await connectRedis();
    }

    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${pong}`);
    }

    checks.redis = true;
  } catch (error) {
    issues.redis = error.message || "Redis client is not connected.";
  }

  if (checks.db && checks.redis) {
    return success(
      res,
      {
        service: "Ha-Meem Attendance & Shift Management API",
        status: "READY",
        checks
      },
      "Dependencies are ready"
    );
  }

  return res.status(503).json({
    success: false,
    message: "Dependencies are not ready",
    data: {
      service: "Ha-Meem Attendance & Shift Management API",
      status: "DEGRADED",
      checks,
      issues
    }
  });
});

app.get("/api/v1", (req, res) => {
  return success(res, null, "API is running");
});

app.use("/api/auth", authRouter);
app.use("/api/gate", gateRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/registrations", registrationRouter);
app.use("/api/shifts", shiftRouter);
app.use("/api/rules", ruleRouter);
app.use("/api/roster", rosterRouter);
app.use("/api/reports", reportRouter);
app.use("/api/export", exportRouter);

app.get("/api/v1/profile", authenticate, (req, res) => {
  return success(res, req.user, "Authenticated user profile");
});

app.get("/api/v1/admin/ping", authenticate, authorize("ADMIN"), (req, res) => {
  return success(res, { role: req.user.role }, "Admin route is reachable");
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use(errorHandler);

export default app;
