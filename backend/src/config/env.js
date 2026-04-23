import dotenv from "dotenv";

dotenv.config();

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const requiredVars = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
];

const missingVars = requiredVars.filter(
  (key) => !process.env[key] || process.env[key].trim() === ""
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}`
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toPositiveInt(process.env.PORT, 5000),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  DB_CONNECT_MAX_RETRIES: toPositiveInt(process.env.DB_CONNECT_MAX_RETRIES, 8),
  DB_RETRY_DELAY_MS: toPositiveInt(process.env.DB_RETRY_DELAY_MS, 1500),
  DB_CONNECT_TIMEOUT_MS: toPositiveInt(process.env.DB_CONNECT_TIMEOUT_MS, 5000),
  REDIS_CONNECT_MAX_RETRIES: toPositiveInt(
    process.env.REDIS_CONNECT_MAX_RETRIES,
    8
  ),
  REDIS_RETRY_DELAY_MS: toPositiveInt(process.env.REDIS_RETRY_DELAY_MS, 1000),
  REDIS_SOCKET_CONNECT_TIMEOUT_MS: toPositiveInt(
    process.env.REDIS_SOCKET_CONNECT_TIMEOUT_MS,
    5000
  ),
  SHUTDOWN_TIMEOUT_MS: toPositiveInt(process.env.SHUTDOWN_TIMEOUT_MS, 10000),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
};
