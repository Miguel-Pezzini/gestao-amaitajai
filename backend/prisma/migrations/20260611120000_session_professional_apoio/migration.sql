-- AlterTable
ALTER TABLE "SessionProfessional" ADD COLUMN "isApoio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SessionProfessional" ADD COLUMN "participationStartAt" TIMESTAMP(3);
ALTER TABLE "SessionProfessional" ADD COLUMN "participationEndAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SessionSeriesProfessional" ADD COLUMN "isApoio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SessionSeriesProfessional" ADD COLUMN "participationStartMinutes" INTEGER;
ALTER TABLE "SessionSeriesProfessional" ADD COLUMN "participationEndMinutes" INTEGER;
