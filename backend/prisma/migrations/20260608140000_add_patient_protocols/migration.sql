-- CreateEnum
CREATE TYPE "ProtocolRequestType" AS ENUM ('DOCUMENTO', 'TROCA_HORARIO', 'SEGUNDA_VIA', 'ENCAMINHAMENTO', 'CANCELAMENTO');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "PatientProtocol" (
    "id" UUID NOT NULL,
    "protocolNumber" INTEGER NOT NULL,
    "patientId" UUID NOT NULL,
    "requestType" "ProtocolRequestType" NOT NULL,
    "status" "ProtocolStatus" NOT NULL DEFAULT 'PENDENTE',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProtocol_protocolNumber_key" ON "PatientProtocol"("protocolNumber");

-- CreateIndex
CREATE INDEX "PatientProtocol_patientId_status_idx" ON "PatientProtocol"("patientId", "status");

-- CreateIndex
CREATE INDEX "PatientProtocol_status_createdAt_idx" ON "PatientProtocol"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PatientProtocol_protocolNumber_idx" ON "PatientProtocol"("protocolNumber");

-- AddForeignKey
ALTER TABLE "PatientProtocol" ADD CONSTRAINT "PatientProtocol_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProtocol" ADD CONSTRAINT "PatientProtocol_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProtocol" ADD CONSTRAINT "PatientProtocol_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
