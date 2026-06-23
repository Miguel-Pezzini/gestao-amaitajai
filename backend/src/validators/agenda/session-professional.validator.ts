import { ValidationError } from "../../errors/http-errors.js";
import type { SessionModality } from "../../domain/agenda.js";
import { isUuid, normalizeText, parseDate } from "./agenda.utils.js";
import {
  buildOccurrenceStartAt,
  getTimeMinutesFromDate,
  toDateOnly,
} from "../../services/session-recurrence.helpers.js";

export type SessionProfessionalInput = {
  professionalId: string;
  isApoio: boolean;
  participationStartAt: Date | null;
  participationEndAt: Date | null;
};

export type SeriesProfessionalInput = SessionProfessionalInput & {
  participationStartMinutes: number | null;
  participationEndMinutes: number | null;
};

function parseBoolean(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "true" || normalized === "1") {
    return true;
  }
  if (normalized === "false" || normalized === "0") {
    return false;
  }
  return fallback;
}

function parseProfessionalEntry(value: unknown): SessionProfessionalInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const professionalId = normalizeText(record.professionalId);
  if (!professionalId) {
    return null;
  }

  const isApoio = parseBoolean(record.isApoio);
  const participationStartAt = isApoio ? parseDate(record.participationStartAt) : null;
  const participationEndAt = isApoio ? parseDate(record.participationEndAt) : null;

  return {
    professionalId,
    isApoio,
    participationStartAt,
    participationEndAt,
  };
}

export function parseSessionProfessionals(
  payload: { professionals?: unknown; professionalIds?: unknown },
  fallback?: SessionProfessionalInput[],
): SessionProfessionalInput[] {
  if (Array.isArray(payload.professionals) && payload.professionals.length > 0) {
    const parsed = payload.professionals
      .map(parseProfessionalEntry)
      .filter((item): item is SessionProfessionalInput => item !== null);

    const seen = new Set<string>();
    return parsed.filter((item) => {
      if (seen.has(item.professionalId)) {
        return false;
      }
      seen.add(item.professionalId);
      return true;
    });
  }

  const ids = Array.isArray(payload.professionalIds)
    ? payload.professionalIds.map((value) => normalizeText(value)).filter(Boolean)
    : [];

  if (ids.length > 0) {
    const seen = new Set<string>();
    return ids
      .filter((id) => {
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      })
      .map((professionalId) => ({
        professionalId,
        isApoio: false,
        participationStartAt: null,
        participationEndAt: null,
      }));
  }

  return fallback ?? [];
}

export function validateSessionProfessionals(
  professionals: SessionProfessionalInput[],
  params: {
    modality: SessionModality;
    sessionStartAt: Date;
    sessionEndAt: Date;
  },
): void {
  if (professionals.length === 0) {
    throw new ValidationError("Adicione ao menos um profissional à sessão.");
  }

  for (const professional of professionals) {
    if (!isUuid(professional.professionalId)) {
      throw new ValidationError("Usuário ou profissional selecionado é inválido.");
    }

    if (professional.isApoio && params.modality !== "GRUPO") {
      throw new ValidationError("Profissional de apoio só é permitido em sessões em grupo.");
    }

    if (professional.isApoio) {
      if (!professional.participationStartAt || !professional.participationEndAt) {
        throw new ValidationError("Informe horário de entrada e saída do profissional de apoio.");
      }

      if (professional.participationStartAt >= professional.participationEndAt) {
        throw new ValidationError(
          "Horário de saída do apoio deve ser posterior ao horário de entrada.",
        );
      }

      if (professional.participationStartAt < params.sessionStartAt) {
        throw new ValidationError(
          "Horário de entrada do apoio não pode ser anterior ao início da sessão.",
        );
      }

      if (professional.participationEndAt > params.sessionEndAt) {
        throw new ValidationError(
          "Horário de saída do apoio não pode ser posterior ao fim da sessão.",
        );
      }
    } else if (professional.participationStartAt || professional.participationEndAt) {
      throw new ValidationError(
        "Horários de participação só podem ser informados para profissionais de apoio.",
      );
    }
  }
}

export function toSeriesProfessionalInput(
  professional: SessionProfessionalInput,
): SeriesProfessionalInput {
  if (!professional.isApoio) {
    return {
      ...professional,
      participationStartMinutes: null,
      participationEndMinutes: null,
    };
  }

  return {
    ...professional,
    participationStartMinutes: getTimeMinutesFromDate(professional.participationStartAt as Date),
    participationEndMinutes: getTimeMinutesFromDate(professional.participationEndAt as Date),
  };
}

export function resolveOccurrenceProfessional(
  seriesProfessional: SeriesProfessionalInput,
  occurrenceStartAt: Date,
  occurrenceEndAt: Date,
): SessionProfessionalInput {
  if (!seriesProfessional.isApoio) {
    return {
      professionalId: seriesProfessional.professionalId,
      isApoio: false,
      participationStartAt: null,
      participationEndAt: null,
    };
  }

  const dateOnly = toDateOnly(occurrenceStartAt);
  const participationStartAt = buildOccurrenceStartAt(
    dateOnly,
    seriesProfessional.participationStartMinutes as number,
  );
  const participationEndAt = buildOccurrenceStartAt(
    dateOnly,
    seriesProfessional.participationEndMinutes as number,
  );

  validateSessionProfessionals(
    [
      {
        professionalId: seriesProfessional.professionalId,
        isApoio: true,
        participationStartAt,
        participationEndAt,
      },
    ],
    {
      modality: "GRUPO",
      sessionStartAt: occurrenceStartAt,
      sessionEndAt: occurrenceEndAt,
    },
  );

  return {
    professionalId: seriesProfessional.professionalId,
    isApoio: true,
    participationStartAt,
    participationEndAt,
  };
}

export function toSessionProfessionalCreateData(professional: SessionProfessionalInput) {
  return {
    professionalId: professional.professionalId,
    isApoio: professional.isApoio,
    participationStartAt: professional.isApoio ? professional.participationStartAt : null,
    participationEndAt: professional.isApoio ? professional.participationEndAt : null,
  };
}

export function toSeriesProfessionalCreateData(professional: SeriesProfessionalInput) {
  return {
    professionalId: professional.professionalId,
    isApoio: professional.isApoio,
    participationStartMinutes: professional.isApoio ? professional.participationStartMinutes : null,
    participationEndMinutes: professional.isApoio ? professional.participationEndMinutes : null,
  };
}
