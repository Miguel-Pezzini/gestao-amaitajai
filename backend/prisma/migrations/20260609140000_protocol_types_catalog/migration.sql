-- CreateTable
CREATE TABLE "ProtocolType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolType_name_key" ON "ProtocolType"("name");

-- CreateIndex
CREATE INDEX "ProtocolType_isActive_idx" ON "ProtocolType"("isActive");

-- Seed tipos existentes para migração dos protocolos já cadastrados
INSERT INTO "ProtocolType" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Solicitação de documento', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Troca de horário', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Segunda via', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Encaminhamento', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Cancelamento', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AddColumn
ALTER TABLE "PatientProtocol" ADD COLUMN "protocolTypeId" UUID;

-- Migrate existing requestType values to protocolTypeId
UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."requestType"::text = 'DOCUMENTO' AND pt."name" = 'Solicitação de documento';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."requestType"::text = 'TROCA_HORARIO' AND pt."name" = 'Troca de horário';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."requestType"::text = 'SEGUNDA_VIA' AND pt."name" = 'Segunda via';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."requestType"::text = 'ENCAMINHAMENTO' AND pt."name" = 'Encaminhamento';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."requestType"::text = 'CANCELAMENTO' AND pt."name" = 'Cancelamento';

-- Fallback para valores legados em minúsculas
UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."protocolTypeId" IS NULL
  AND pp."requestType"::text IN ('documento', 'DOCUMENTO')
  AND pt."name" = 'Solicitação de documento';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."protocolTypeId" IS NULL
  AND pp."requestType"::text IN ('troca_horario', 'TROCA_HORARIO')
  AND pt."name" = 'Troca de horário';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."protocolTypeId" IS NULL
  AND pp."requestType"::text IN ('segunda_via', 'SEGUNDA_VIA')
  AND pt."name" = 'Segunda via';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."protocolTypeId" IS NULL
  AND pp."requestType"::text IN ('encaminhamento', 'ENCAMINHAMENTO')
  AND pt."name" = 'Encaminhamento';

UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = pt."id"
FROM "ProtocolType" AS pt
WHERE pp."protocolTypeId" IS NULL
  AND pp."requestType"::text IN ('cancelamento', 'CANCELAMENTO')
  AND pt."name" = 'Cancelamento';

-- Garante valor para qualquer protocolo remanescente
UPDATE "PatientProtocol" AS pp
SET "protocolTypeId" = (
  SELECT pt."id" FROM "ProtocolType" AS pt WHERE pt."name" = 'Solicitação de documento' LIMIT 1
)
WHERE pp."protocolTypeId" IS NULL;

ALTER TABLE "PatientProtocol" ALTER COLUMN "protocolTypeId" SET NOT NULL;

-- DropColumn
ALTER TABLE "PatientProtocol" DROP COLUMN "requestType";

-- DropEnum
DROP TYPE "ProtocolRequestType";

-- CreateIndex
CREATE INDEX "PatientProtocol_protocolTypeId_idx" ON "PatientProtocol"("protocolTypeId");

-- AddForeignKey
ALTER TABLE "PatientProtocol" ADD CONSTRAINT "PatientProtocol_protocolTypeId_fkey" FOREIGN KEY ("protocolTypeId") REFERENCES "ProtocolType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
