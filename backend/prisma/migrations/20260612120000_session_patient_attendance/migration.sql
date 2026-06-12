-- CreateEnum
CREATE TYPE "SessionAttendanceStatus" AS ENUM ('PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA');

-- AlterTable
ALTER TABLE "SessionPatient" ADD COLUMN     "attendanceStatus" "SessionAttendanceStatus" NOT NULL DEFAULT 'PRESENTE',
ADD COLUMN     "attendanceJustification" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "attendanceUpdatedById" UUID,
ADD COLUMN     "attendanceUpdatedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "SessionPatient" ADD CONSTRAINT "SessionPatient_attendanceUpdatedById_fkey" FOREIGN KEY ("attendanceUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
