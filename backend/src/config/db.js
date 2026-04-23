import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { env } from "./env.js";

const globalForPrisma = globalThis;
const { Pool } = pg;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: env.DB_CONNECT_TIMEOUT_MS
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
  globalForPrisma.prisma = prisma;
}

export const connectDb = async () => {
  for (let attempt = 1; attempt <= env.DB_CONNECT_MAX_RETRIES; attempt += 1) {
    try {
      await prisma.$connect();
      if (attempt > 1) {
        console.log(`[DB] Connected on retry attempt ${attempt}.`);
      } else {
        console.log("[DB] Connected.");
      }
      return;
    } catch (error) {
      const isLastAttempt = attempt === env.DB_CONNECT_MAX_RETRIES;
      console.error(
        `[DB] Connection attempt ${attempt}/${env.DB_CONNECT_MAX_RETRIES} failed: ${error.message}`
      );

      if (isLastAttempt) {
        throw error;
      }

      await sleep(env.DB_RETRY_DELAY_MS * attempt);
    }
  }
};
