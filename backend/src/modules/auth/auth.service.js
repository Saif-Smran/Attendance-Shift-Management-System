import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../config/db.js";
import { env } from "../../config/env.js";
import { connectRedis, getRedisClient } from "../../config/redis.js";

const REFRESH_TOKEN_PREFIX = "auth:refresh:";
const ALLOWED_REQUESTED_ROLES = new Set(["EMPLOYEE", "SECURITY", "HR"]);
const ALLOWED_EMPLOYEE_CATEGORIES = new Set(["WORKER", "STAFF"]);

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeIdentifier = (value) => String(value || "").trim();

const parseDurationToSeconds = (duration, fallbackSeconds) => {
  const match = /^([0-9]+)([smhd])$/i.exec(String(duration || "").trim());

  if (!match) {
    return fallbackSeconds;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    return fallbackSeconds;
  }

  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24
  };

  return amount * multipliers[unit];
};

const ensureRedisClient = async () => {
  let client = getRedisClient();

  if (!client?.isOpen) {
    client = await connectRedis();
  }

  return client;
};

const refreshRedisKey = (userId) => `${REFRESH_TOKEN_PREFIX}${userId}`;

const sanitizeUser = (user) => ({
  id: user.id,
  employeeCode: user.employeeCode,
  employeeCategory: user.employeeCategory,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  departmentId: user.departmentId,
  shiftId: user.shiftId
});

const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

export const login = async (identifier, password) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const normalizedEmployeeCode = normalizedIdentifier.toUpperCase();

  if (!normalizedIdentifier || !password) {
    throw toError("Identifier and password are required", 400);
  }

  const whereClause = normalizedIdentifier.includes("@")
    ? { email: normalizeEmail(normalizedIdentifier) }
    : {
        OR: [
          { email: normalizeEmail(normalizedIdentifier) },
          { employeeCode: normalizedEmployeeCode }
        ]
      };

  const user = await prisma.user.findFirst({
    where: whereClause
  });

  if (!user) {
    throw toError("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw toError("Invalid credentials", 401);
  }

  if (user.status === "PENDING") {
    throw toError("Registration pending approval", 403);
  }

  if (user.status === "INACTIVE") {
    throw toError("Account deactivated", 403);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshTtlSeconds = parseDurationToSeconds(
    env.JWT_REFRESH_EXPIRES_IN,
    7 * 24 * 60 * 60
  );

  const redisClient = await ensureRedisClient();
  await redisClient.set(refreshRedisKey(user.id), refreshToken, {
    EX: refreshTtlSeconds
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
};

export const register = async ({
  name,
  email,
  password,
  departmentId,
  requestedRole,
  requestedEmployeeCategory
}) => {
  const normalizedName = String(name || "").trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail || !password || !requestedRole) {
    throw toError(
      "Name, email, password, and requested role are required",
      400
    );
  }

  if (!ALLOWED_REQUESTED_ROLES.has(requestedRole)) {
    throw toError("Invalid requested role", 400);
  }

  if (requestedRole === "EMPLOYEE") {
    if (!ALLOWED_EMPLOYEE_CATEGORIES.has(requestedEmployeeCategory)) {
      throw toError("Employee registrations must include WORKER or STAFF", 400);
    }
  }

  if (requestedRole === "SECURITY" && requestedEmployeeCategory) {
    throw toError("Security registration does not require employee category", 400);
  }

  const [existingUser, existingRegistration] = await Promise.all([
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    }),
    prisma.registration.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    })
  ]);

  if (existingUser || existingRegistration) {
    throw toError("Email is already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.registration.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      departmentId: departmentId || null,
      requestedRole,
      requestedEmployeeCategory: requestedEmployeeCategory || null,
      status: "PENDING"
    }
  });

  return {
    message:
      "Your registration has been submitted and is under review. You will be able to log in once approved."
  };
};

export const refreshToken = async (token) => {
  if (!token) {
    throw toError("Refresh token is required", 400);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    throw toError("Invalid refresh token", 401);
  }

  const userId = decoded.sub || decoded.id;

  if (!userId) {
    throw toError("Invalid refresh token payload", 401);
  }

  const redisClient = await ensureRedisClient();
  const savedToken = await redisClient.get(refreshRedisKey(userId));

  if (!savedToken || savedToken !== token) {
    throw toError("Refresh token is not valid", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw toError("User not found", 401);
  }

  if (user.status === "INACTIVE") {
    throw toError("Account deactivated", 403);
  }

  if (user.status === "PENDING") {
    throw toError("Registration pending approval", 403);
  }

  return {
    accessToken: signAccessToken(user)
  };
};

export const logout = async (userId) => {
  if (!userId) {
    throw toError("User id is required", 400);
  }

  const redisClient = await ensureRedisClient();
  await redisClient.del(refreshRedisKey(userId));

  return {
    message: "Logged out successfully"
  };
};

export const listDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true
    }
  });

  return departments;
};
