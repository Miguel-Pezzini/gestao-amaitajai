import { prisma, basePrisma } from "../db/prisma.js";
import {
  beginTestTransaction as beginPrismaTestTransaction,
  rollbackTestTransaction as rollbackPrismaTestTransaction,
} from "../db/prisma-test-transaction.js";

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function resetDatabaseForTests(): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables.map((row) => `"public"."${row.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
}

/** Inicia transação interativa; todas as queries do Prisma rodam dentro dela até o rollback. */
export async function beginTestTransaction(): Promise<void> {
  await beginPrismaTestTransaction(basePrisma);
}

/** Desfaz a transação de teste sem persistir alterações. */
export async function rollbackTestTransaction(): Promise<void> {
  await rollbackPrismaTestTransaction();
}
