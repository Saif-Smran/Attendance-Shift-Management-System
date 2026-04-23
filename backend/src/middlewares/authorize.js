import { error as errorResponse } from "../utils/apiResponse.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        "You are not allowed to access this resource",
        403
      );
    }

    return next();
  };
};
