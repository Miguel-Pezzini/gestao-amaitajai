import {
  PROTOCOL_REQUEST_TYPES,
  PROTOCOL_STATUSES,
  type ProtocolRequestType,
  type ProtocolStatus,
} from "../../domain/protocol.js";
import { ValidationError } from "../../errors/http-errors.js";
import { isUuid } from "../agenda/agenda.utils.js";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function parseProtocolRequestType(value: unknown): ProtocolRequestType | null {
  const raw = normalizeText(value).toUpperCase();
  return PROTOCOL_REQUEST_TYPES.find((item) => item === raw) ?? null;
}

export function parseProtocolStatus(value: unknown): ProtocolStatus | null {
  const raw = normalizeText(value).toUpperCase();
  return PROTOCOL_STATUSES.find((item) => item === raw) ?? null;
}

export function validateCreateProtocol(payload: {
  patientId?: unknown;
  requestType?: unknown;
  notes?: unknown;
}) {
  const patientId = normalizeText(payload.patientId);
  const requestType = parseProtocolRequestType(payload.requestType);
  const notes = normalizeText(payload.notes);

  if (!patientId || !isUuid(patientId)) {
    throw new ValidationError("Paciente inválido para o protocolo.");
  }
  if (!requestType) {
    throw new ValidationError(
      `Tipo de solicitação inválido. Valores permitidos: ${PROTOCOL_REQUEST_TYPES.join(", ")}.`,
    );
  }

  return { patientId, requestType, notes };
}

export function validateUpdateProtocolStatus(payload: { status?: unknown }) {
  const status = parseProtocolStatus(payload.status);
  if (!status) {
    throw new ValidationError(
      `Status inválido. Valores permitidos: ${PROTOCOL_STATUSES.join(", ")}.`,
    );
  }

  return { status };
}
