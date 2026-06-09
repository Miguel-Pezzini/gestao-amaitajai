-- AlterEnum
ALTER TYPE "ProtocolStatus" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "PatientProtocol" ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "cancelReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN "cancelledAt" TIMESTAMP(3);
