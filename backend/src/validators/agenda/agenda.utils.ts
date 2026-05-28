import mongoose from "mongoose";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isMongoDuplicateKeyError(
  error: unknown,
): error is { code: number; keyPattern?: Record<string, unknown> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export function duplicateRoomMessage(error: { keyPattern?: Record<string, unknown> }): string {
  if (error.keyPattern?.name) {
    return "Já existe uma sala com este nome.";
  }
  return "Sala já cadastrada.";
}

export function parseDate(value: unknown): Date | null {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseUniqueIdArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

export function isObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value);
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseLimit(value: unknown, fallback = 10, max = 30): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}
