import { ValidationError } from "../../errors/http-errors.js";
import { SESSION_MODALITIES, type SessionModality } from "../../domain/agenda.js";
import { isUuid, normalizeText, parseUniqueIdArray, slugify } from "./agenda.utils.js";

function parseAllowedModalities(value: unknown): SessionModality[] {
  return parseUniqueIdArray(value).filter((item) =>
    SESSION_MODALITIES.includes(item as SessionModality),
  ) as SessionModality[];
}

export function validateCreateSessionType(payload: {
  name?: unknown;
  defaultDurationMinutes?: unknown;
  isDurationFlexible?: unknown;
  allowedModalities?: unknown;
}): {
  name: string;
  slug: string;
  defaultDurationMinutes: number;
  isDurationFlexible: boolean;
  allowedModalities: SessionModality[];
} {
  const name = normalizeText(payload.name);
  const slug = slugify(name);
  const defaultDurationMinutes = Number.parseInt(String(payload.defaultDurationMinutes), 10);
  const isDurationFlexible = Boolean(payload.isDurationFlexible);
  const allowedModalities = parseAllowedModalities(payload.allowedModalities);

  if (!name || !slug || !Number.isFinite(defaultDurationMinutes) || defaultDurationMinutes <= 0) {
    throw new ValidationError("Dados inválidos para tipo de sessão.");
  }
  if (allowedModalities.length === 0) {
    throw new ValidationError("Informe ao menos uma modalidade permitida.");
  }
  if (slug === "tea-14-plus" && allowedModalities.some((item) => item !== "grupo")) {
    throw new ValidationError("Tipo tea-14-plus permite apenas modalidade grupo.");
  }

  return { name, slug, defaultDurationMinutes, isDurationFlexible, allowedModalities };
}

export function validateUpdateSessionType(
  sessionTypeId: string,
  payload: {
    name?: unknown;
    defaultDurationMinutes?: unknown;
    isDurationFlexible?: unknown;
    allowedModalities?: unknown;
  },
  existing: {
    slug: string;
    name: string;
    defaultDurationMinutes: number;
    isDurationFlexible: boolean;
    allowedModalities: SessionModality[];
  },
): {
  name?: string;
  defaultDurationMinutes?: number;
  isDurationFlexible?: boolean;
  allowedModalities?: SessionModality[];
} {
  if (!isUuid(sessionTypeId)) {
    throw new ValidationError("Identificador de tipo de sessão inválido.");
  }

  const update: {
    name?: string;
    defaultDurationMinutes?: number;
    isDurationFlexible?: boolean;
    allowedModalities?: SessionModality[];
  } = {};

  const next = {
    name: existing.name,
    defaultDurationMinutes: existing.defaultDurationMinutes,
    isDurationFlexible: existing.isDurationFlexible,
    allowedModalities: [...existing.allowedModalities],
  };

  if (payload.name !== undefined) {
    const name = normalizeText(payload.name);
    if (!name) {
      throw new ValidationError("Nome é obrigatório.");
    }
    update.name = name;
    next.name = name;
  }

  if (payload.defaultDurationMinutes !== undefined) {
    const defaultDurationMinutes = Number.parseInt(String(payload.defaultDurationMinutes), 10);
    if (!Number.isFinite(defaultDurationMinutes) || defaultDurationMinutes <= 0) {
      throw new ValidationError("Duração padrão inválida.");
    }
    update.defaultDurationMinutes = defaultDurationMinutes;
    next.defaultDurationMinutes = defaultDurationMinutes;
  }

  if (payload.isDurationFlexible !== undefined) {
    update.isDurationFlexible = Boolean(payload.isDurationFlexible);
    next.isDurationFlexible = update.isDurationFlexible;
  }

  if (payload.allowedModalities !== undefined) {
    const allowedModalities = parseAllowedModalities(payload.allowedModalities);
    if (allowedModalities.length === 0) {
      throw new ValidationError("Informe ao menos uma modalidade permitida.");
    }
    update.allowedModalities = allowedModalities;
    next.allowedModalities = allowedModalities;
  }

  if (existing.slug === "tea-14-plus" && next.allowedModalities.some((item) => item !== "grupo")) {
    throw new ValidationError("Tipo tea-14-plus permite apenas modalidade grupo.");
  }

  return update;
}

export function validateSessionTypeId(sessionTypeId: string): void {
  if (!isUuid(sessionTypeId)) {
    throw new ValidationError("Identificador de tipo de sessão inválido.");
  }
}
