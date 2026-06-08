-- UserRole
ALTER TYPE "UserRole" RENAME VALUE 'administrador' TO 'ADMINISTRADOR';
ALTER TYPE "UserRole" RENAME VALUE 'tecnico' TO 'TECNICO';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TECNICO';

-- FundingSource
ALTER TYPE "FundingSource" RENAME VALUE 'Municipal' TO 'MUNICIPAL';
ALTER TYPE "FundingSource" RENAME VALUE 'Estadual' TO 'ESTADUAL';
ALTER TYPE "FundingSource" RENAME VALUE 'Particular' TO 'PARTICULAR';

-- SessionModality
ALTER TYPE "SessionModality" RENAME VALUE 'individual' TO 'INDIVIDUAL';
ALTER TYPE "SessionModality" RENAME VALUE 'dupla' TO 'DUPLA';
ALTER TYPE "SessionModality" RENAME VALUE 'grupo' TO 'GRUPO';

-- SessionStatus
ALTER TYPE "SessionStatus" RENAME VALUE 'agendada' TO 'AGENDADA';
ALTER TYPE "SessionStatus" RENAME VALUE 'realizada' TO 'REALIZADA';
ALTER TYPE "SessionStatus" RENAME VALUE 'cancelada' TO 'CANCELADA';
ALTER TABLE "Session" ALTER COLUMN "status" SET DEFAULT 'AGENDADA';
