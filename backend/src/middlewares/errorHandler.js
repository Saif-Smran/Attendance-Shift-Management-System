import { Prisma } from "@prisma/client";

import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        message = `Unique constraint failed on ${err.meta?.target || "field"}`;
        break;
      case "P2025":
        statusCode = 404;
        message = "Requested record was not found";
        break;
      default:
        statusCode = 400;
        message = "Database request failed";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid database payload";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Access token expired";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid access token";
  } else if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    details = err.errors;
  } else if (Array.isArray(err?.errors)) {
    statusCode = 400;
    message = "Validation failed";
    details = err.errors;
  }

  const payload = {
    success: false,
    message
  };

  if (details) {
    payload.details = details;
  }

  if (env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};
