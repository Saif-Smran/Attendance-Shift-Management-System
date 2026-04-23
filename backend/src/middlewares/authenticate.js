import jwt from "jsonwebtoken";

import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { error as errorResponse } from "../utils/apiResponse.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Access token is missing or invalid", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      return errorResponse(res, "Invalid token payload", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employeeCode: true,
        employeeCategory: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        shiftId: true
      }
    });

    if (!user) {
      return errorResponse(res, "User not found", 401);
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
