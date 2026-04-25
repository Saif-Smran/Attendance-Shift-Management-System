import { prisma } from "../../config/db.js";

const LEAVE_STATUS_SET = new Set(["PENDING", "APPROVED", "REJECTED"]);

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const sanitizeLeaveApplication = (leaveApplication) => ({
  id: leaveApplication.id,
  userId: leaveApplication.userId,
  employeeCode: leaveApplication.user?.employeeCode || null,
  employeeName: leaveApplication.user?.name || null,
  fromDate: leaveApplication.fromDate,
  toDate: leaveApplication.toDate,
  reason: leaveApplication.reason,
  status: leaveApplication.status,
  reviewedBy: leaveApplication.reviewedBy,
  reviewedAt: leaveApplication.reviewedAt,
  reviewerName: leaveApplication.reviewer?.name || null,
  createdAt: leaveApplication.createdAt
});

export const getAllLeaveApplications = async (filters = {}) => {
  const page = parsePositiveNumber(filters.page, 1);
  const limit = Math.min(parsePositiveNumber(filters.limit, 10), 100);
  const statusFilter = String(filters.status || "")
    .trim()
    .toUpperCase();
  const search = String(filters.search || "").trim();

  if (statusFilter && !LEAVE_STATUS_SET.has(statusFilter)) {
    throw toError("Invalid leave status filter", 400);
  }

  const where = {};
  const andConditions = [];

  if (statusFilter) {
    andConditions.push({ status: statusFilter });
  }

  if (search) {
    andConditions.push({
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { employeeCode: { contains: search, mode: "insensitive" } }
        ]
      }
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const skip = (page - 1) * limit;

  const [leaveApplications, total] = await Promise.all([
    prisma.leaveApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            name: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip
    }),
    prisma.leaveApplication.count({ where })
  ]);

  return {
    items: leaveApplications.map(sanitizeLeaveApplication),
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 1 : Math.ceil(total / limit)
    }
  };
};

const reviewLeaveApplication = async (id, reviewerId, status) => {
  if (!reviewerId) {
    throw toError("Reviewer is required", 401);
  }

  const leaveApplication = await prisma.leaveApplication.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!leaveApplication) {
    throw toError("Leave application not found", 404);
  }

  if (leaveApplication.status !== "PENDING") {
    throw toError(
      `Leave application is already ${leaveApplication.status.toLowerCase()}`,
      400
    );
  }

  const updatedLeaveApplication = await prisma.leaveApplication.update({
    where: {
      id
    },
    data: {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          employeeCode: true,
          name: true
        }
      },
      reviewer: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return sanitizeLeaveApplication(updatedLeaveApplication);
};

export const approveLeaveApplication = async (id, reviewerId) => {
  return reviewLeaveApplication(id, reviewerId, "APPROVED");
};

export const rejectLeaveApplication = async (id, reviewerId) => {
  return reviewLeaveApplication(id, reviewerId, "REJECTED");
};
