import { createClient } from "redis";

import { env } from "./env.js";

let redisClient;
let redisConnectPromise;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildRedisClient = () => {
  const client = createClient({
    url: env.REDIS_URL,
    socket: {
      connectTimeout: env.REDIS_SOCKET_CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries) => {
        if (retries >= env.REDIS_CONNECT_MAX_RETRIES) {
          return new Error("[Redis] Maximum reconnect attempts reached.");
        }

        return Math.min(env.REDIS_RETRY_DELAY_MS * (retries + 1), 5000);
      }
    }
  });

  client.on("error", (error) => {
    console.error("Redis client error:", error.message);
  });

  client.on("reconnecting", () => {
    console.warn("[Redis] Reconnecting...");
  });

  return client;
};

export const getRedisClient = () => redisClient;

export const connectRedis = async () => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  if (!redisClient) {
    redisClient = buildRedisClient();
  }

  redisConnectPromise = (async () => {
    for (
      let attempt = 1;
      attempt <= env.REDIS_CONNECT_MAX_RETRIES;
      attempt += 1
    ) {
      try {
        await redisClient.connect();
        if (attempt > 1) {
          console.log(`[Redis] Connected on retry attempt ${attempt}.`);
        } else {
          console.log("[Redis] Connected.");
        }

        return redisClient;
      } catch (error) {
        const isLastAttempt = attempt === env.REDIS_CONNECT_MAX_RETRIES;
        console.error(
          `[Redis] Connection attempt ${attempt}/${env.REDIS_CONNECT_MAX_RETRIES} failed: ${error.message}`
        );

        if (isLastAttempt) {
          redisClient = undefined;
          throw error;
        }

        await sleep(env.REDIS_RETRY_DELAY_MS * attempt);
      }
    }

    redisClient = undefined;
    throw new Error("Redis connection attempts exhausted.");
  })();

  try {
    return await redisConnectPromise;
  } finally {
    redisConnectPromise = null;
  }
};

export const disconnectRedis = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }

  redisClient = undefined;
};
