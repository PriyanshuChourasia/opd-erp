-- CreateEnum
CREATE TYPE "EmployeeScheduleExceptionType" AS ENUM ('EXTRA_SHIFT', 'OVERRIDE', 'DAY_OFF');

-- CreateTable
CREATE TABLE "EmployeeScheduleException" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "EmployeeScheduleExceptionType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "shiftId" TEXT,
    "employeeSchedulableType" TEXT NOT NULL,
    "employeeSchedulableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "EmployeeScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emp_sched_exc_type_id_date" ON "EmployeeScheduleException"("employeeSchedulableType", "employeeSchedulableId", "date");

-- CreateIndex
CREATE INDEX "emp_sched_exc_type_id" ON "EmployeeScheduleException"("employeeSchedulableType", "employeeSchedulableId");

-- CreateIndex
CREATE INDEX "emp_sched_exc_date" ON "EmployeeScheduleException"("date");

-- CreateIndex
CREATE INDEX "EmployeeScheduleException_shiftId_idx" ON "EmployeeScheduleException"("shiftId");

-- CreateIndex
CREATE INDEX "EmployeeScheduleException_createdById_idx" ON "EmployeeScheduleException"("createdById");

-- CreateIndex
CREATE INDEX "EmployeeScheduleException_updatedById_idx" ON "EmployeeScheduleException"("updatedById");

-- AddForeignKey
ALTER TABLE "EmployeeScheduleException" ADD CONSTRAINT "EmployeeScheduleException_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeScheduleException" ADD CONSTRAINT "EmployeeScheduleException_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeScheduleException" ADD CONSTRAINT "EmployeeScheduleException_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeScheduleException" ADD CONSTRAINT "EmployeeScheduleException_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

