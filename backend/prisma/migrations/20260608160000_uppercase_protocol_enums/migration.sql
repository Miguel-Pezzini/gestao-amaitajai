-- ProtocolRequestType
ALTER TYPE "ProtocolRequestType" RENAME VALUE 'documento' TO 'DOCUMENTO';
ALTER TYPE "ProtocolRequestType" RENAME VALUE 'troca_horario' TO 'TROCA_HORARIO';
ALTER TYPE "ProtocolRequestType" RENAME VALUE 'segunda_via' TO 'SEGUNDA_VIA';
ALTER TYPE "ProtocolRequestType" RENAME VALUE 'encaminhamento' TO 'ENCAMINHAMENTO';
ALTER TYPE "ProtocolRequestType" RENAME VALUE 'cancelamento' TO 'CANCELAMENTO';

-- ProtocolStatus: PENDENTE + CONCLUIDO (migra feito/entregue para CONCLUIDO)
CREATE TYPE "ProtocolStatus_new" AS ENUM ('PENDENTE', 'CONCLUIDO');

ALTER TABLE "PatientProtocol" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "PatientProtocol"
  ALTER COLUMN "status" TYPE "ProtocolStatus_new"
  USING (
    CASE "status"::text
      WHEN 'pendente' THEN 'PENDENTE'
      WHEN 'feito' THEN 'CONCLUIDO'
      WHEN 'entregue' THEN 'CONCLUIDO'
      WHEN 'PENDENTE' THEN 'PENDENTE'
      WHEN 'CONCLUIDO' THEN 'CONCLUIDO'
      ELSE 'PENDENTE'
    END::"ProtocolStatus_new"
  );

ALTER TABLE "PatientProtocol" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';

DROP TYPE "ProtocolStatus";
ALTER TYPE "ProtocolStatus_new" RENAME TO "ProtocolStatus";
