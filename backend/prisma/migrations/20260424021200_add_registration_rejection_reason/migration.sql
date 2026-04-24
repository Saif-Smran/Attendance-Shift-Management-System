-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'EMPLOYEE', 'SECURITY');

-- CreateEnum
CREATE TYPE "EmployeeCategory" AS ENUM ('WORKER', 'STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('GENERAL_DAY', 'NIGHT', 'SECURITY_DAY', 'SECURITY_NIGHT', 'FRIDAY', 'RAMADAN_DAY', 'RAMADAN_NIGHT');

-- CreateEnum
CREATE TYPE "OvertimeMethod" AS ENUM ('AFTER_8_HOURS');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'EXCESSIVE_LATE', 'EARLY_EXIT', 'EARLY_EXIT_OVER_1HR', 'ABSENT');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "employeeCategory" "EmployeeCategory",
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "departmentId" TEXT,
    "shiftId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShiftType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakDurationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRule" (
    "id" TEXT NOT NULL,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "excessiveLateAfterMinutes" INTEGER NOT NULL DEFAULT 15,
    "tiffinBreakMinutes" INTEGER NOT NULL DEFAULT 60,
    "earlyExitFlagStartMinutes" INTEGER NOT NULL DEFAULT 60,
    "earlyExitFlagEndMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxRosterDays" INTEGER NOT NULL DEFAULT 14,
    "securityOT" BOOLEAN NOT NULL DEFAULT false,
    "otMethod" "OvertimeMethod" NOT NULL DEFAULT 'AFTER_8_HOURS',
    "ramadanActive" BOOLEAN NOT NULL DEFAULT false,
    "ramadanStartDate" TIMESTAMP(3),
    "ramadanEndDate" TIMESTAMP(3),
    "iftarTime" TEXT,
    "sehriStart" TEXT NOT NULL DEFAULT '04:00',
    "sehriEnd" TEXT NOT NULL DEFAULT '05:00',
    "iftarConflictStart" TEXT NOT NULL DEFAULT '05:30',
    "iftarConflictEnd" TEXT NOT NULL DEFAULT '06:30',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "departmentId" TEXT,
    "requestedRole" "Role" NOT NULL,
    "requestedEmployeeCategory" "EmployeeCategory",
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRamadan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyExitMinutes" INTEGER NOT NULL DEFAULT 0,
    "missedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sehriBreakApplied" BOOLEAN NOT NULL DEFAULT false,
    "iftarBreakApplied" BOOLEAN NOT NULL DEFAULT false,
    "isRamadan" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReasons" TEXT[],
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_shiftId_idx" ON "User"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_name_type_key" ON "Shift"("name", "type");

-- CreateIndex
CREATE INDEX "AttendanceRule_effectiveFrom_idx" ON "AttendanceRule"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_email_key" ON "Registration"("email");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_departmentId_idx" ON "Registration"("departmentId");

-- CreateIndex
CREATE INDEX "Registration_reviewedBy_idx" ON "Registration"("reviewedBy");

-- CreateIndex
CREATE INDEX "Roster_date_idx" ON "Roster"("date");

-- CreateIndex
CREATE INDEX "Roster_shiftId_date_idx" ON "Roster"("shiftId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Roster_userId_date_key" ON "Roster"("userId", "date");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE INDEX "Attendance_ruleId_idx" ON "Attendance"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "LeaveApplication_userId_idx" ON "LeaveApplication"("userId");

-- CreateIndex
CREATE INDEX "LeaveApplication_status_idx" ON "LeaveApplication"("status");

-- CreateIndex
CREATE INDEX "LeaveApplication_fromDate_toDate_idx" ON "LeaveApplication"("fromDate", "toDate");

-- CreateIndex
CREATE INDEX "LeaveApplication_reviewedBy_idx" ON "LeaveApplication"("reviewedBy");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roster" ADD CONSTRAINT "Roster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roster" ADD CONSTRAINT "Roster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AttendanceRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
