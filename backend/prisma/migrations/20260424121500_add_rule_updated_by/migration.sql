-- Add updater metadata for attendance rules to support "last updated by" in HR rules page.
ALTER TABLE "AttendanceRule"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedById" TEXT;

ALTER TABLE "AttendanceRule"
ADD CONSTRAINT "AttendanceRule_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "AttendanceRule_updatedById_idx" ON "AttendanceRule"("updatedById");
