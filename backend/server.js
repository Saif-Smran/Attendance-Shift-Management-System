import app from "./src/app.js";
import { connectDb, prisma } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { connectRedis, disconnectRedis } from "./src/config/redis.js";

const startServer = async () => {
  try {
    await connectDb();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      console.log(`Backend server running on http://localhost:${env.PORT}`);
    });
    let shutdownInitiated = false;

    const shutdown = (signal) => {
      if (shutdownInitiated) {
        return;
      }

      shutdownInitiated = true;
      console.log(`${signal} received. Shutting down gracefully...`);

      const forceShutdownTimer = setTimeout(() => {
        console.error(
          `Graceful shutdown timed out after ${env.SHUTDOWN_TIMEOUT_MS}ms. Forcing process exit.`
        );
        process.exit(1);
      }, env.SHUTDOWN_TIMEOUT_MS);

      forceShutdownTimer.unref();

      server.close((closeError) => {
        if (closeError) {
          clearTimeout(forceShutdownTimer);
          console.error("Error while closing HTTP server:", closeError);
          process.exit(1);
          return;
        }

        void (async () => {
          try {
            await prisma.$disconnect();
            await disconnectRedis();
            clearTimeout(forceShutdownTimer);
            process.exit(0);
          } catch (error) {
            clearTimeout(forceShutdownTimer);
            console.error("Error during resource cleanup:", error);
            process.exit(1);
          }
        })();
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
