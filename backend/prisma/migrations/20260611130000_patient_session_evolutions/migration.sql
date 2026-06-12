-- CreateTable
CREATE TABLE "PatientSessionEvolution" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientSessionEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientSessionEvolution_sessionId_patientId_key" ON "PatientSessionEvolution"("sessionId", "patientId");

-- CreateIndex
CREATE INDEX "PatientSessionEvolution_patientId_createdAt_idx" ON "PatientSessionEvolution"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "PatientSessionEvolution_sessionId_idx" ON "PatientSessionEvolution"("sessionId");

-- AddForeignKey
ALTER TABLE "PatientSessionEvolution" ADD CONSTRAINT "PatientSessionEvolution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSessionEvolution" ADD CONSTRAINT "PatientSessionEvolution_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSessionEvolution" ADD CONSTRAINT "PatientSessionEvolution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSessionEvolution" ADD CONSTRAINT "PatientSessionEvolution_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
