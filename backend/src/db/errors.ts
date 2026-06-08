import { Prisma } from "@prisma/client";

export function isPrismaUniqueViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function duplicateRoomMessage(error: Prisma.PrismaClientKnownRequestError): string {
  const target = error.meta?.target;
  if (Array.isArray(target) && target.includes("name")) {
    return "Já existe uma sala com este nome.";
  }
  return "Sala já cadastrada.";
}
