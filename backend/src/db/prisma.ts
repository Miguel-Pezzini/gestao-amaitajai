import { PrismaClient } from "@prisma/client";
import { createTestAwarePrismaClient } from "./prisma-test-transaction.js";

const globalForPrisma = globalThis as unknown as {
  basePrisma?: PrismaClient;
  prisma?: PrismaClient;
};

const basePrisma =
  globalForPrisma.basePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

function createPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "test") {
    return createTestAwarePrismaClient(basePrisma);
  }
  return basePrisma;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.basePrisma = basePrisma;
  globalForPrisma.prisma = prisma;
}

export { basePrisma };
