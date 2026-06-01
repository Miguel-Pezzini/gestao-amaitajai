-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('administrador', 'tecnico');

-- CreateEnum
CREATE TYPE "FundingSource" AS ENUM ('Municipal', 'Estadual', 'Particular');

-- CreateEnum
CREATE TYPE "SessionModality" AS ENUM ('individual', 'dupla', 'grupo');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('agendada', 'realizada', 'cancelada');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'tecnico',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "guardianName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fundingSource" "FundingSource" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL,
    "isDurationFlexible" BOOLEAN NOT NULL DEFAULT false,
    "allowedModalities" "SessionModality"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "sessionTypeId" UUID NOT NULL,
    "modality" "SessionModality" NOT NULL,
    "roomId" UUID NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'agendada',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPatient" (
    "sessionId" UUID NOT NULL,
    "patientId" UUID NOT NULL,

    CONSTRAINT "SessionPatient_pkey" PRIMARY KEY ("sessionId","patientId")
);

-- CreateTable
CREATE TABLE "SessionProfessional" (
    "sessionId" UUID NOT NULL,
    "professionalId" UUID NOT NULL,

    CONSTRAINT "SessionProfessional_pkey" PRIMARY KEY ("sessionId","professionalId")
);

-- CreateTable
CREATE TABLE "SessionModalitySetting" (
    "id" UUID NOT NULL,
    "modality" "SessionModality" NOT NULL,
    "minPatients" INTEGER NOT NULL,
    "maxPatients" INTEGER NOT NULL,
    "minProfessionals" INTEGER NOT NULL,
    "maxProfessionals" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionModalitySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "Patient_isActive_fullName_idx" ON "Patient"("isActive", "fullName");

-- CreateIndex
CREATE INDEX "Patient_fundingSource_isActive_fullName_idx" ON "Patient"("fundingSource", "isActive", "fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE INDEX "Room_isActive_idx" ON "Room"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SessionType_slug_key" ON "SessionType"("slug");

-- CreateIndex
CREATE INDEX "SessionType_name_idx" ON "SessionType"("name");

-- CreateIndex
CREATE INDEX "SessionType_isActive_idx" ON "SessionType"("isActive");

-- CreateIndex
CREATE INDEX "Session_startAt_endAt_idx" ON "Session"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "Session_roomId_startAt_endAt_idx" ON "Session"("roomId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "SessionPatient_patientId_idx" ON "SessionPatient"("patientId");

-- CreateIndex
CREATE INDEX "SessionProfessional_professionalId_idx" ON "SessionProfessional"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionModalitySetting_modality_key" ON "SessionModalitySetting"("modality");

-- CreateIndex
CREATE INDEX "SessionModalitySetting_isActive_idx" ON "SessionModalitySetting"("isActive");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sessionTypeId_fkey" FOREIGN KEY ("sessionTypeId") REFERENCES "SessionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPatient" ADD CONSTRAINT "SessionPatient_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPatient" ADD CONSTRAINT "SessionPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProfessional" ADD CONSTRAINT "SessionProfessional_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProfessional" ADD CONSTRAINT "SessionProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
