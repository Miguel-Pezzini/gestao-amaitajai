import { Prisma } from "@prisma/client";

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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
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

export function parsePage(value: unknown, fallback = 1): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function shouldPaginateList(query: Record<string, unknown>): boolean {
  return query.page !== undefined || query.limit !== undefined;
}

export function containsInsensitive(term: string): Prisma.StringFilter {
  return { contains: term, mode: "insensitive" };
}
