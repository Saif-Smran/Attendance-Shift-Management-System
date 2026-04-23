const ROLE_PREFIX = {
  ADMIN: "AD",
  HR: "HR",
  SECURITY: "SG"
};

const EMPLOYEE_CATEGORY_PREFIX = {
  WORKER: "GW",
  STAFF: "ST"
};

const resolvePrefix = (role, employeeCategory) => {
  const normalizedRole = role?.toUpperCase();

  if (normalizedRole === "EMPLOYEE") {
    const normalizedCategory = employeeCategory?.toUpperCase();
    const employeePrefix = EMPLOYEE_CATEGORY_PREFIX[normalizedCategory];

    if (!employeePrefix) {
      throw new Error(
        "EMPLOYEE requires employeeCategory as WORKER or STAFF for code generation"
      );
    }

    return employeePrefix;
  }

  const prefix = ROLE_PREFIX[normalizedRole];

  if (!prefix) {
    throw new Error(`Unsupported role for employee code generation: ${role}`);
  }

  return prefix;
};

export const generateEmployeeCode = (
  role,
  lastCount = 0,
  employeeCategory = "WORKER"
) => {
  const prefix = resolvePrefix(role, employeeCategory);
  const safeCount = Number.isFinite(Number(lastCount))
    ? Math.max(0, Number(lastCount))
    : 0;
  const nextCount = safeCount + 1;

  return `${prefix}-${String(nextCount).padStart(4, "0")}`;
};
