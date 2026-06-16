-- CreateEnum
CREATE TYPE "SessionChangeRequestType" AS ENUM ('EDIT', 'CANCEL');

-- CreateEnum
CREATE TYPE "SessionChangeRequestStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "SessionChangeRequest" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "SessionChangeRequestType" NOT NULL,
    "status" "SessionChangeRequestStatus" NOT NULL DEFAULT 'PENDENTE',
    "updateScope" TEXT,
    "proposedPayload" JSONB NOT NULL,
    "requestedById" UUID NOT NULL,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionChangeRequest_status_createdAt_idx" ON "SessionChangeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SessionChangeRequest_sessionId_status_idx" ON "SessionChangeRequest"("sessionId", "status");

-- CreateIndex
CREATE INDEX "SessionChangeRequest_requestedById_status_idx" ON "SessionChangeRequest"("requestedById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionChangeRequest_sessionId_pendente_key" ON "SessionChangeRequest"("sessionId") WHERE "status" = 'PENDENTE';

-- AddForeignKey
ALTER TABLE "SessionChangeRequest" ADD CONSTRAINT "SessionChangeRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChangeRequest" ADD CONSTRAINT "SessionChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionChangeRequest" ADD CONSTRAINT "SessionChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
