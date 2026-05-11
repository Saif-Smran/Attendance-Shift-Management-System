import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

const SHIFTS = [
  {
    name: "General Day",
    type: "GENERAL_DAY",
    startTime: "08:00",
    endTime: "17:00",
    breakDurationMinutes: 60
  },
  {
    name: "Ramadan Day",
    type: "RAMADAN_DAY",
    startTime: "08:00",
    endTime: "16:00",
    breakDurationMinutes: 60
  },
  {
    name: "Night Shift",
    type: "NIGHT",
    startTime: "21:00",
    endTime: "06:00",
    breakDurationMinutes: 60
  },
  {
    name: "Ramadan Night",
    type: "RAMADAN_NIGHT",
    startTime: "21:00",
    endTime: "05:00",
    breakDurationMinutes: 60
  },
  {
    name: "Security Day",
    type: "SECURITY_DAY",
    startTime: "06:00",
    endTime: "18:00",
    breakDurationMinutes: 60
  },
  {
    name: "Security Night",
    type: "SECURITY_NIGHT",
    startTime: "18:00",
    endTime: "06:00",
    breakDurationMinutes: 60
  },
  {
    name: "Friday",
    type: "FRIDAY",
    startTime: "08:00",
    endTime: "17:00",
    breakDurationMinutes: 60
  }
];

const seedShifts = async () => {
  for (const shift of SHIFTS) {
    await prisma.shift.upsert({
      where: {
        name_type: {
          name: shift.name,
          type: shift.type
        }
      },
      update: {
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakDurationMinutes: shift.breakDurationMinutes
      },
      create: shift
    });
  }
};

const run = async () => {
  await seedShifts();

  // Seed initial users from password.md (safe-upsert)
  const USERS = [
    {
      name: "Admin User",
      email: "admin@example.com",
      employeeCode: "AD-0001",
      role: "ADMIN",
      status: "ACTIVE"
    },
    {
      name: "HR User",
      email: "hr@example.com",
      employeeCode: "HR-0001",
      role: "HR",
      status: "ACTIVE"
    },
    {
      name: "Employee User",
      email: "employee@example.com",
      employeeCode: "ST-0001",
      role: "EMPLOYEE",
      status: "ACTIVE"
    }
  ];

  const PASSWORD_MAP = {
    "admin@example.com": "Hm#PypkoYAbtE",
    "hr@example.com": "Hm#hw2CDfoUJX",
    "employee@example.com": "Hm#6gbRqcYqMp"
  };

  for (const u of USERS) {
    const rawPassword = PASSWORD_MAP[u.email] || "Hm#defaultPass123";
    const hashed = await bcrypt.hash(rawPassword, 10);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        employeeCode: u.employeeCode,
        role: u.role,
        status: u.status,
        password: hashed
      },
      create: {
        name: u.name,
        email: u.email,
        employeeCode: u.employeeCode,
        role: u.role,
        status: u.status,
        password: hashed
      }
    });
  }

  console.log("Seed complete: default shifts and users are ready.");
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
