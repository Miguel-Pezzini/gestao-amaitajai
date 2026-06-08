-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('pendente', 'ativo', 'inativo');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleId" TEXT,
ADD COLUMN "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'ativo';

UPDATE "User" SET "accountStatus" = 'inativo' WHERE "isActive" = false;

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

DROP INDEX "User_role_isActive_idx";

ALTER TABLE "User" DROP COLUMN "isActive";

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

CREATE INDEX "User_role_accountStatus_idx" ON "User"("role", "accountStatus");
