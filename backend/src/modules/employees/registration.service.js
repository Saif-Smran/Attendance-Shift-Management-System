import { prisma } from "../../config/db.js";
import { generateEmployeeCode } from "../../utils/employeeId.js";

const REGISTRATION_STATUS_SET = new Set(["PENDING", "APPROVED", "REJECTED"]);

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

const sanitizeEmployee = (user, departmentName = null) => ({
  id: user.id,
  employeeCode: user.employeeCode,
  employeeCategory: user.employeeCategory,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  departmentId: user.departmentId,
  departmentName,
  shiftId: user.shiftId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const sanitizeRegistration = (registration) => ({
  id: registration.id,
  name: registration.name,
  email: registration.email,
  requestedRole: registration.requestedRole,
  requestedEmployeeCategory: registration.requestedEmployeeCategory,
  departmentId: registration.departmentId,
  departmentName: registration.department?.name || null,
  status: registration.status,
  reviewedBy: registration.reviewedBy,
  reviewerName: registration.reviewer?.name || null,
  reviewedAt: registration.reviewedAt,
  rejectionReason: registration.rejectionReason,
  createdAt: registration.createdAt
});

const getRolePrefix = (role, employeeCategory) => {
  const sampleCode = generateEmployeeCode(role, 0, employeeCategory || "WORKER");
  return sampleCode.split("-")[0];
};

const resolveEmployeeCategory = (requestedRole, requestedEmployeeCategory) => {
  if (requestedRole !== "EMPLOYEE") {
    return null;
  }

  const normalizedCategory = String(requestedEmployeeCategory || "WORKER")
    .trim()
    .toUpperCase();

  if (!["WORKER", "STAFF"].includes(normalizedCategory)) {
    throw toError("EMPLOYEE registration requires WORKER or STAFF category", 400);
  }

  return normalizedCategory;
};

const getNextEmployeeCode = async (role, employeeCategory) => {
  const prefix = getRolePrefix(role, employeeCategory);

  const lastRecord = await prisma.user.findFirst({
    where: {
      employeeCode: {
        startsWith: `${prefix}-`
      }
    },
    orderBy: {
      employeeCode: "desc"
    },
    select: {
      employeeCode: true
    }
  });

  const lastNumber = lastRecord
    ? Number.parseInt(lastRecord.employeeCode.split("-")[1], 10) || 0
    : 0;

  return generateEmployeeCode(role, lastNumber, employeeCategory || "WORKER");
};

export const getAllRegistrations = async (filters = {}) => {
  const page = parsePositiveNumber(filters.page, 1);
  const limit = Math.min(parsePositiveNumber(filters.limit, 10), 100);
  const statusFilter = String(filters.status || "")
    .trim()
    .toUpperCase();
  const search = String(filters.search || "").trim();

  if (statusFilter && !REGISTRATION_STATUS_SET.has(statusFilter)) {
    throw toError("Invalid registration status filter", 400);
  }

  const where = {};
  const andConditions = [];

  if (statusFilter) {
    andConditions.push({ status: statusFilter });
  }

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const skip = (page - 1) * limit;

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
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
    prisma.registration.count({ where })
  ]);

  return {
    items: registrations.map(sanitizeRegistration),
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 1 : Math.ceil(total / limit)
    }
  };
};

export const approveRegistration = async (id, reviewerId) => {
  if (!reviewerId) {
    throw toError("Reviewer is required", 401);
  }

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!registration) {
    throw toError("Registration not found", 404);
  }

  if (registration.status !== "PENDING") {
    throw toError(`Registration is already ${registration.status.toLowerCase()}`, 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: registration.email
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    throw toError("A user account with this email already exists", 409);
  }

  const employeeCategory = resolveEmployeeCategory(
    registration.requestedRole,
    registration.requestedEmployeeCategory
  );
  const employeeCode = await getNextEmployeeCode(
    registration.requestedRole,
    employeeCategory || "WORKER"
  );

  const result = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        employeeCode,
        employeeCategory,
        name: registration.name,
        email: registration.email,
        password: registration.password,
        role: registration.requestedRole,
        departmentId: registration.departmentId,
        status: "ACTIVE"
      }
    });

    const updatedRegistration = await transaction.registration.update({
      where: {
        id: registration.id
      },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null
      },
      include: {
        department: {
          select: {
            id: true,
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

    return {
      user,
      registration: updatedRegistration
    };
  });

  return {
    employee: sanitizeEmployee(result.user, registration.department?.name || null),
    registration: sanitizeRegistration(result.registration)
  };
};

export const rejectRegistration = async (id, reviewerId, reason) => {
  if (!reviewerId) {
    throw toError("Reviewer is required", 401);
  }

  const rejectionReason = String(reason || "").trim();

  if (!rejectionReason) {
    throw toError("Rejection reason is required", 400);
  }

  const registration = await prisma.registration.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!registration) {
    throw toError("Registration not found", 404);
  }

  if (registration.status !== "PENDING") {
    throw toError(`Registration is already ${registration.status.toLowerCase()}`, 400);
  }

  const updatedRegistration = await prisma.registration.update({
    where: {
      id
    },
    data: {
      status: "REJECTED",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason
    },
    include: {
      department: {
        select: {
          id: true,
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

  return sanitizeRegistration(updatedRegistration);
};
