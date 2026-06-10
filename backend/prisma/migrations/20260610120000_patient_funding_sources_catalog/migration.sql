-- CreateTable
CREATE TABLE "PatientFundingSource" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientFundingSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PatientFundingSource_name_key" ON "PatientFundingSource"("name");

-- CreateIndex
CREATE INDEX "PatientFundingSource_isActive_idx" ON "PatientFundingSource"("isActive");

-- Seed fontes de custeio atuais
INSERT INTO "PatientFundingSource" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Municipal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Estadual', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Particular', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AddColumn
ALTER TABLE "Patient" ADD COLUMN "fundingSourceId" UUID;

-- Migrate existing fundingSource enum values to fundingSourceId
UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSource"::text = 'MUNICIPAL' AND pfs."name" = 'Municipal';

UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSource"::text = 'ESTADUAL' AND pfs."name" = 'Estadual';

UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSource"::text = 'PARTICULAR' AND pfs."name" = 'Particular';

-- Fallback para valores legados em minúsculas/título
UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSourceId" IS NULL
  AND p."fundingSource"::text IN ('Municipal', 'municipal', 'MUNICIPAL')
  AND pfs."name" = 'Municipal';

UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSourceId" IS NULL
  AND p."fundingSource"::text IN ('Estadual', 'estadual', 'ESTADUAL')
  AND pfs."name" = 'Estadual';

UPDATE "Patient" AS p
SET "fundingSourceId" = pfs."id"
FROM "PatientFundingSource" AS pfs
WHERE p."fundingSourceId" IS NULL
  AND p."fundingSource"::text IN ('Particular', 'particular', 'PARTICULAR')
  AND pfs."name" = 'Particular';

-- Garante valor para qualquer paciente remanescente
UPDATE "Patient" AS p
SET "fundingSourceId" = (
  SELECT pfs."id" FROM "PatientFundingSource" AS pfs WHERE pfs."name" = 'Municipal' LIMIT 1
)
WHERE p."fundingSourceId" IS NULL;

ALTER TABLE "Patient" ALTER COLUMN "fundingSourceId" SET NOT NULL;

-- DropColumn
ALTER TABLE "Patient" DROP COLUMN "fundingSource";

-- DropEnum
DROP TYPE "FundingSource";

-- DropIndex
DROP INDEX IF EXISTS "Patient_fundingSource_isActive_fullName_idx";

-- CreateIndex
CREATE INDEX "Patient_fundingSourceId_isActive_fullName_idx" ON "Patient"("fundingSourceId", "isActive", "fullName");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_fundingSourceId_fkey" FOREIGN KEY ("fundingSourceId") REFERENCES "PatientFundingSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
