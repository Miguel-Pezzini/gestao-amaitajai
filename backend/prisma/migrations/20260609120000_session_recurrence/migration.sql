-- CreateEnum
CREATE TYPE "SessionSeriesStatus" AS ENUM ('ativa', 'encerrada', 'cancelada');

-- CreateTable
CREATE TABLE "SessionSeries" (
    "id" UUID NOT NULL,
    "sessionTypeId" UUID NOT NULL,
    "modality" "SessionModality" NOT NULL,
    "roomId" UUID NOT NULL,
    "weekdays" INTEGER[],
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "SessionSeriesStatus" NOT NULL DEFAULT 'ativa',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSeriesPatient" (
    "seriesId" UUID NOT NULL,
    "patientId" UUID NOT NULL,

    CONSTRAINT "SessionSeriesPatient_pkey" PRIMARY KEY ("seriesId","patientId")
);

-- CreateTable
CREATE TABLE "SessionSeriesProfessional" (
    "seriesId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,

    CONSTRAINT "SessionSeriesProfessional_pkey" PRIMARY KEY ("seriesId","professionalId")
);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "seriesId" UUID;

-- CreateIndex
CREATE INDEX "SessionSeries_status_idx" ON "SessionSeries"("status");

-- CreateIndex
CREATE INDEX "SessionSeries_startsAt_endsAt_idx" ON "SessionSeries"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SessionSeriesPatient_patientId_idx" ON "SessionSeriesPatient"("patientId");

-- CreateIndex
CREATE INDEX "SessionSeriesProfessional_professionalId_idx" ON "SessionSeriesProfessional"("professionalId");

-- CreateIndex
CREATE INDEX "Session_seriesId_startAt_idx" ON "Session"("seriesId", "startAt");

-- AddForeignKey
ALTER TABLE "SessionSeries" ADD CONSTRAINT "SessionSeries_sessionTypeId_fkey" FOREIGN KEY ("sessionTypeId") REFERENCES "SessionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeries" ADD CONSTRAINT "SessionSeries_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeries" ADD CONSTRAINT "SessionSeries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeries" ADD CONSTRAINT "SessionSeries_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeriesPatient" ADD CONSTRAINT "SessionSeriesPatient_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "SessionSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeriesPatient" ADD CONSTRAINT "SessionSeriesPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeriesProfessional" ADD CONSTRAINT "SessionSeriesProfessional_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "SessionSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSeriesProfessional" ADD CONSTRAINT "SessionSeriesProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "SessionSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
