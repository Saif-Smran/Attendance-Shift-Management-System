import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

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
  console.log("Seed complete: default shifts are ready.");
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
