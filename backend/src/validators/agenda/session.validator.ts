import { ValidationError } from "../../errors/http-errors.js";
import {
  validateCancelScope,
  type CancelScope,
} from "./recurrence.validator.js";
import {
  SESSION_MODALITIES,
  type SessionModality,
} from "../../domain/agenda.js";
import { isUuid, normalizeText, parseDate, parseUniqueIdArray } from "./agenda.utils.js";

const SESSION_FORMAT_LABELS: Record<SessionModality, string> = {
  INDIVIDUAL: "Individual",
  DUPLA: "Dupla",
  GRUPO: "Grupo",
};

export type SessionPayload = {
  sessionTypeId?: unknown;
  modality?: unknown;
  roomId?: unknown;
  startAt?: unknown;
  durationMinutes?: unknown;
  patientIds?: unknown;
  professionalIds?: unknown;
  notes?: unknown;
};

export type NormalizedSessionInput = {
  sessionTypeId: string;
  modality: SessionModality;
  roomId: string;
  startAt: Date | null;
  durationMinutes: number;
  patientIds: string[];
  professionalIds: string[];
  notes: string;
};

export function normalizeSessionInput(
  payload: SessionPayload,
  fallback?: {
    sessionTypeId: string;
    modality: SessionModality;
    roomId: string;
    startAt: Date;
    durationMinutes: number;
    patientIds: string[];
    professionalIds: string[];
    notes: string;
  },
): NormalizedSessionInput {
  const sessionTypeId = normalizeText(payload.sessionTypeId) || fallback?.sessionTypeId || "";
  const modality = (
    normalizeText(payload.modality).toUpperCase() || fallback?.modality || ""
  ) as SessionModality;
  const roomId = normalizeText(payload.roomId) || fallback?.roomId || "";
  const startAt = parseDate(payload.startAt) ?? fallback?.startAt ?? null;
  const durationMinutes =
    Number.parseInt(String(payload.durationMinutes), 10) || fallback?.durationMinutes || 0;
  const patientIds = parseUniqueIdArray(payload.patientIds);
  const professionalIds = parseUniqueIdArray(payload.professionalIds);
  const notes =
    payload.notes === undefined ? (fallback?.notes ?? "") : normalizeText(payload.notes);

  return {
    sessionTypeId,
    modality,
    roomId,
    startAt,
    durationMinutes,
    patientIds: patientIds.length > 0 ? patientIds : (fallback?.patientIds ?? []),
    professionalIds:
      professionalIds.length > 0 ? professionalIds : (fallback?.professionalIds ?? []),
    notes,
  };
}

export function validateSession(input: NormalizedSessionInput): void {
  if (!isUuid(input.sessionTypeId)) {
    throw new ValidationError("Selecione uma modalidade de atendimento.");
  }
  if (!SESSION_MODALITIES.includes(input.modality)) {
    throw new ValidationError("Selecione um tipo de sessão válido (INDIVIDUAL, DUPLA ou GRUPO).");
  }
  if (!isUuid(input.roomId)) {
    throw new ValidationError("Selecione uma sala.");
  }
  if (!input.startAt) {
    throw new ValidationError("Informe data e hora de início.");
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new ValidationError("Informe uma duração válida em minutos.");
  }
  if (input.patientIds.length === 0) {
    throw new ValidationError("Adicione ao menos um paciente à sessão.");
  }
  if (input.professionalIds.length === 0) {
    throw new ValidationError("Adicione ao menos um profissional à sessão.");
  }
  if (
    !input.patientIds.every((id) => isUuid(id)) ||
    !input.professionalIds.every((id) => isUuid(id))
  ) {
    throw new ValidationError("Paciente ou profissional selecionado é inválido.");
  }

}

export function validateSessionModality(
  allowedModalities: SessionModality[],
  modality: SessionModality,
): void {
  if (!allowedModalities.includes(modality)) {
    const formatLabel = SESSION_FORMAT_LABELS[modality] ?? modality;
    throw new ValidationError(
      `A modalidade selecionada não permite tipo de sessão ${formatLabel}.`,
    );
  }
}

export function validateSessionId(sessionId: string): void {
  if (!isUuid(sessionId)) {
    throw new ValidationError("Identificador de sessão inválido.");
  }
}

export function validateCancelSession(
  sessionId: string,
  payload: { cancelReason?: unknown; scope?: unknown },
): { cancelReason: string; scope: CancelScope } {
  validateSessionId(sessionId);

  const cancelReason = normalizeText(payload.cancelReason);
  if (!cancelReason) {
    throw new ValidationError("Motivo do cancelamento é obrigatório.");
  }
  const scope = validateCancelScope(payload.scope);
  return { cancelReason, scope };
}

export function validateUpdateSession(sessionId: string, status: string): void {
  validateSessionId(sessionId);
  if (status === "CANCELADA") {
    throw new ValidationError("Sessão cancelada não pode ser editada.");
  }
}

export function validateCompleteSession(sessionId: string, status: string): void {
  validateSessionId(sessionId);
  if (status === "CANCELADA") {
    throw new ValidationError("Sessão cancelada não pode ser marcada como realizada.");
  }
}
