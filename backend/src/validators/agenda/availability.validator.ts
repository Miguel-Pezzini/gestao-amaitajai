import { ValidationError } from "../../errors/http-errors.js";
import {
  escapeRegex,
  isObjectId,
  normalizeText,
  parseDate,
  parseLimit,
} from "./agenda.utils.js";

export const AVAILABILITY_MIN_SEARCH_LENGTH = 2;

export type AvailabilityLookupInput = {
  startAt: Date;
  endAt: Date;
  q: string;
  availableOnly: boolean;
  excludeSessionId?: string;
  limit: number;
  summaryOnly: boolean;
};

function parseSummaryOnly(value: unknown): boolean {
  if (value === true || value === "true" || value === "1") {
    return true;
  }
  return false;
}

function parseAvailableOnly(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  if (value === false || value === "false" || value === "0") {
    return false;
  }
  return true;
}

export function parseAvailabilityLookupQuery(
  query: Record<string, unknown>,
): AvailabilityLookupInput | null {
  const startAt = parseDate(query.startAt);
  if (!startAt) {
    return null;
  }

  let endAt = parseDate(query.endAt);
  if (!endAt) {
    const durationMinutes = Number.parseInt(String(query.durationMinutes ?? ""), 10);
    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
    }
  }

  if (!endAt || endAt <= startAt) {
    throw new ValidationError("Informe um intervalo válido (término ou duração em minutos).");
  }

  const excludeSessionId = normalizeText(query.excludeSessionId);
  if (excludeSessionId && !isObjectId(excludeSessionId)) {
    throw new ValidationError("Sessão inválida para exclusão de conflito.");
  }

  return {
    startAt,
    endAt,
    q: normalizeText(query.q),
    availableOnly: parseAvailableOnly(query.availableOnly),
    excludeSessionId: excludeSessionId || undefined,
    limit: parseLimit(query.limit, 8, 20),
    summaryOnly: parseSummaryOnly(query.summaryOnly),
  };
}

export function hasAvailabilitySearchTerm(q: string): boolean {
  return q.length >= AVAILABILITY_MIN_SEARCH_LENGTH;
}

export function buildNameSearchMatcher(term: string): RegExp | null {
  if (!term) {
    return null;
  }
  return new RegExp(escapeRegex(term), "i");
}
