-- UserAccountStatus
ALTER TYPE "UserAccountStatus" RENAME VALUE 'pendente' TO 'PENDENTE';
ALTER TYPE "UserAccountStatus" RENAME VALUE 'ativo' TO 'ATIVO';
ALTER TYPE "UserAccountStatus" RENAME VALUE 'inativo' TO 'INATIVO';
ALTER TABLE "User" ALTER COLUMN "accountStatus" SET DEFAULT 'ATIVO';

-- SessionSeriesStatus
ALTER TYPE "SessionSeriesStatus" RENAME VALUE 'ativa' TO 'ATIVA';
ALTER TYPE "SessionSeriesStatus" RENAME VALUE 'encerrada' TO 'ENCERRADA';
ALTER TYPE "SessionSeriesStatus" RENAME VALUE 'cancelada' TO 'CANCELADA';
ALTER TABLE "SessionSeries" ALTER COLUMN "status" SET DEFAULT 'ATIVA';
