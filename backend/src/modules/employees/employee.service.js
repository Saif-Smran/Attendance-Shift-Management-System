import bcrypt from "bcryptjs";
import crypto from "crypto";

import { prisma } from "../../config/db.js";
import { generateEmployeeCode } from "../../utils/employeeId.js";

const ROLE_SET = new Set(["ADMIN", "HR", "EMPLOYEE", "SECURITY"]);
const STATUS_SET = new Set(["ACTIVE", "INACTIVE", "PENDING"]);
const EDITABLE_STATUS_SET = new Set(["ACTIVE", "INACTIVE"]);
const EMPLOYEE_CATEGORY_SET = new Set(["WORKER", "STAFF"]);

const EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  employeeCategory: true,
  name: true,
  email: true,
  role: true,
  status: true,
  departmentId: true,
  shiftId: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      name: true
    }
  },
  shift: {
    select: {
      id: true,
      name: true,
      type: true
    }
  }
};

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

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const sanitizeEmployee = (employee) => ({
  id: employee.id,
  employeeCode: employee.employeeCode,
  employeeCategory: employee.employeeCategory,
  name: employee.name,
  email: employee.email,
  role: employee.role,
  status: employee.status,
  departmentId: employee.departmentId,
  departmentName: employee.department?.name || null,
  shiftId: employee.shiftId,
  shiftName: employee.shift?.name || null,
  shiftType: employee.shift?.type || null,
  createdAt: employee.createdAt,
  updatedAt: employee.updatedAt
});

const getRolePrefix = (role, employeeCategory) => {
  const sampleCode = generateEmployeeCode(role, 0, employeeCategory || "WORKER");
  return sampleCode.split("-")[0];
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

const resolveCategoryForRole = (role, employeeCategory, fallback = null) => {
  if (role !== "EMPLOYEE") {
    return null;
  }

  const normalizedCategory = String(employeeCategory || fallback || "WORKER")
    .trim()
    .toUpperCase();

  if (!EMPLOYEE_CATEGORY_SET.has(normalizedCategory)) {
    throw toError("EMPLOYEE role requires employeeCategory as WORKER or STAFF", 400);
  }

  return normalizedCategory;
};

const ensureDepartmentExists = async (departmentId) => {
  if (!departmentId) {
    return;
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true }
  });

  if (!department) {
    throw toError("Department not found", 404);
  }
};

const ensureShiftExists = async (shiftId) => {
  if (!shiftId) {
    return;
  }

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: { id: true }
  });

  if (!shift) {
    throw toError("Shift not found", 404);
  }
};

const createTemporaryPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const size = 10;
  let randomPart = "";

  for (let index = 0; index < size; index += 1) {
    randomPart += alphabet[crypto.randomInt(0, alphabet.length)];
  }

  return `Hm#${randomPart}`;
};

const parseEmployeeFilters = (filters = {}) => {
  const page = parsePositiveNumber(filters.page, 1);
  const limit = Math.min(parsePositiveNumber(filters.limit, 10), 100);
  const search = String(filters.search || "").trim();
  const department = String(filters.department || "").trim();
  const role = String(filters.role || "")
    .trim()
    .toUpperCase();
  const status = String(filters.status || "")
    .trim()
    .toUpperCase();
  const sortBy = String(filters.sortBy || "createdAt").trim();
  const sortOrder = String(filters.sortOrder || "desc").trim().toLowerCase() === "asc" ? "asc" : "desc";

  if (role && !ROLE_SET.has(role)) {
    throw toError("Invalid role filter", 400);
  }

  if (status && !STATUS_SET.has(status)) {
    throw toError("Invalid status filter", 400);
  }

  const allowedSortFields = new Set(["createdAt", "name", "employeeCode", "updatedAt"]);
  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";

  return {
    page,
    limit,
    search,
    department,
    role,
    status,
    sortBy: safeSortBy,
    sortOrder,
    skip: (page - 1) * limit
  };
};

const buildEmployeeWhereClause = ({ search, department, role, status }) => {
  const conditions = [];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  if (department) {
    conditions.push({
      OR: [
        { departmentId: department },
        {
          department: {
            name: {
              contains: department,
              mode: "insensitive"
            }
          }
        }
      ]
    });
  }

  if (role) {
    conditions.push({ role });
  }

  if (status) {
    conditions.push({ status });
  }

  if (conditions.length === 0) {
    return {};
  }

  return {
    AND: conditions
  };
};

export const getAllEmployees = async (filters = {}) => {
  const parsedFilters = parseEmployeeFilters(filters);
  const where = buildEmployeeWhereClause(parsedFilters);

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: EMPLOYEE_SELECT,
      orderBy: {
        [parsedFilters.sortBy]: parsedFilters.sortOrder
      },
      take: parsedFilters.limit,
      skip: parsedFilters.skip
    }),
    prisma.user.count({ where })
  ]);

  return {
    items: employees.map(sanitizeEmployee),
    pagination: {
      page: parsedFilters.page,
      limit: parsedFilters.limit,
      total,
      pages: total === 0 ? 1 : Math.ceil(total / parsedFilters.limit)
    }
  };
};

export const createEmployee = async (data = {}) => {
  const role = String(data.role || "")
    .trim()
    .toUpperCase();
  const name = String(data.name || "").trim();
  const email = normalizeEmail(data.email);
  const departmentId = data.departmentId || null;
  const shiftId = data.shiftId || null;

  if (!name || !email || !role) {
    throw toError("Name, email, and role are required", 400);
  }

  if (!ROLE_SET.has(role)) {
    throw toError("Invalid role", 400);
  }

  const employeeCategory = resolveCategoryForRole(role, data.employeeCategory);

  await Promise.all([ensureDepartmentExists(departmentId), ensureShiftExists(shiftId)]);

  const [existingUser, existingRegistration] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { id: true }
    }),
    prisma.registration.findUnique({
      where: { email },
      select: { id: true }
    })
  ]);

  if (existingUser || existingRegistration) {
    throw toError("Email is already in use", 409);
  }

  const temporaryPassword = createTemporaryPassword();
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
  const employeeCode = await getNextEmployeeCode(role, employeeCategory || "WORKER");

  const employee = await prisma.user.create({
    data: {
      employeeCode,
      employeeCategory,
      name,
      email,
      password: hashedPassword,
      role,
      departmentId,
      shiftId,
      status: "ACTIVE"
    },
    select: EMPLOYEE_SELECT
  });

  return {
    employee: sanitizeEmployee(employee),
    temporaryPassword
  };
};

export const getEmployeeById = async (id) => {
  const employee = await prisma.user.findUnique({
    where: { id },
    select: EMPLOYEE_SELECT
  });

  if (!employee) {
    throw toError("Employee not found", 404);
  }

  return sanitizeEmployee(employee);
};

export const updateEmployee = async (id, data = {}) => {
  const existingEmployee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      employeeCategory: true
    }
  });

  if (!existingEmployee) {
    throw toError("Employee not found", 404);
  }

  const payload = {};

  if (data.name !== undefined) {
    const name = String(data.name || "").trim();

    if (!name) {
      throw toError("Name cannot be empty", 400);
    }

    payload.name = name;
  }

  if (data.email !== undefined) {
    const normalizedEmail = normalizeEmail(data.email);

    if (!normalizedEmail) {
      throw toError("Email cannot be empty", 400);
    }

    if (normalizedEmail !== existingEmployee.email) {
      const [otherUser, existingRegistration] = await Promise.all([
        prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true }
        }),
        prisma.registration.findUnique({
          where: { email: normalizedEmail },
          select: { id: true }
        })
      ]);

      if (otherUser || existingRegistration) {
        throw toError("Email is already in use", 409);
      }
    }

    payload.email = normalizedEmail;
  }

  if (Object.hasOwn(data, "departmentId")) {
    const departmentId = data.departmentId || null;
    await ensureDepartmentExists(departmentId);
    payload.departmentId = departmentId;
  }

  if (Object.hasOwn(data, "shiftId")) {
    const shiftId = data.shiftId || null;
    await ensureShiftExists(shiftId);
    payload.shiftId = shiftId;
  }

  if (Object.hasOwn(data, "employeeCategory") && existingEmployee.role === "EMPLOYEE") {
    payload.employeeCategory = resolveCategoryForRole(
      "EMPLOYEE",
      data.employeeCategory,
      existingEmployee.employeeCategory
    );
  }

  const updatedEmployee = await prisma.user.update({
    where: { id },
    data: payload,
    select: EMPLOYEE_SELECT
  });

  return sanitizeEmployee(updatedEmployee);
};

export const deleteEmployee = async (id) => {
  const existingEmployee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      status: true
    }
  });

  if (!existingEmployee) {
    throw toError("Employee not found", 404);
  }

  const employee = await prisma.user.update({
    where: { id },
    data: {
      status: "INACTIVE"
    },
    select: EMPLOYEE_SELECT
  });

  return sanitizeEmployee(employee);
};

export const changeRole = async (id, newRole, employeeCategory) => {
  const role = String(newRole || "")
    .trim()
    .toUpperCase();

  if (!ROLE_SET.has(role)) {
    throw toError("Invalid role", 400);
  }

  const existingEmployee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      employeeCategory: true
    }
  });

  if (!existingEmployee) {
    throw toError("Employee not found", 404);
  }

  const resolvedCategory = resolveCategoryForRole(
    role,
    employeeCategory,
    existingEmployee.employeeCategory || "WORKER"
  );

  const employeeCode = await getNextEmployeeCode(role, resolvedCategory || "WORKER");

  const updatedEmployee = await prisma.user.update({
    where: { id },
    data: {
      role,
      employeeCategory: resolvedCategory,
      employeeCode
    },
    select: EMPLOYEE_SELECT
  });

  return sanitizeEmployee(updatedEmployee);
};

export const changeStatus = async (id, statusValue) => {
  const status = String(statusValue || "")
    .trim()
    .toUpperCase();

  if (!EDITABLE_STATUS_SET.has(status)) {
    throw toError("Status must be ACTIVE or INACTIVE", 400);
  }

  const existingEmployee = await prisma.user.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existingEmployee) {
    throw toError("Employee not found", 404);
  }

  const updatedEmployee = await prisma.user.update({
    where: { id },
    data: {
      status
    },
    select: EMPLOYEE_SELECT
  });

  return sanitizeEmployee(updatedEmployee);
};
