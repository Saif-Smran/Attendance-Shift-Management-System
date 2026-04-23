import cors from "cors";
import express from "express";

import { prisma } from "./config/db.js";
import { env } from "./config/env.js";
import { connectRedis, getRedisClient } from "./config/redis.js";
import { authenticate } from "./middlewares/authenticate.js";
import { authorize } from "./middlewares/authorize.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRouter from "./modules/auth/auth.routes.js";
import gateRouter from "./modules/attendance/gate.routes.js";
import { success } from "./utils/apiResponse.js";

const app = express();

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
