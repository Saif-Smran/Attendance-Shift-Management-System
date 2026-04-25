import { prisma } from "../../config/db.js";

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeDepartment = (department) => ({
  id: department.id,
  name: department.name,
  createdAt: department.createdAt,
  employeeCount: department._count?.users || 0
});

export const getAllDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      _count: {
        select: {
          users: true
        }
      }
    }
  });

  return {
    items: departments.map(sanitizeDepartment),
    total: departments.length
  };
};

export const createDepartment = async (data = {}) => {
  const name = String(data.name || "").trim();

  if (!name) {
    throw toError("Department name is required", 400);
  }

  const department = await prisma.department.create({
    data: {
      name
    },
    include: {
      _count: {
        select: {
          users: true
        }
      }
    }
  });

  return sanitizeDepartment(department);
};

export const updateDepartment = async (id, data = {}) => {
  const name = String(data.name || "").trim();

  if (!name) {
    throw toError("Department name is required", 400);
  }

  const department = await prisma.department.update({
    where: {
      id
    },
    data: {
      name
    },
    include: {
      _count: {
        select: {
          users: true
        }
      }
    }
  });

  return sanitizeDepartment(department);
};

export const deleteDepartment = async (id) => {
  const department = await prisma.department.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!department) {
    throw toError("Department not found", 404);
  }

  const assignedEmployees = await prisma.user.count({
    where: {
      departmentId: id
    }
  });

  if (assignedEmployees > 0) {
    throw toError(
      `Cannot delete department while ${assignedEmployees} employee(s) are assigned`,
      409
    );
  }

  await prisma.department.delete({
    where: {
      id
    }
  });

  return {
    id: department.id,
    name: department.name,
    deleted: true
  };
};
