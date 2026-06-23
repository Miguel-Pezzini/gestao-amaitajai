import { PROTOCOL_STATUSES, type ProtocolStatus } from "../../domain/protocol.js";
import { ValidationError } from "../../errors/http-errors.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

function parseProtocolStatus(value: unknown): ProtocolStatus | null {
  const raw = normalizeText(value).toUpperCase();
  return PROTOCOL_STATUSES.find((item) => item === raw) ?? null;
}

export function validateCreateProtocol(payload: {
  patientId?: unknown;
  protocolTypeId?: unknown;
  notes?: unknown;
}) {
  const patientId = normalizeText(payload.patientId);
  const protocolTypeId = normalizeText(payload.protocolTypeId);
  const notes = normalizeText(payload.notes);

  if (!patientId || !isUuid(patientId)) {
    throw new ValidationError("Usuário inválido para o protocolo.");
  }
  if (!protocolTypeId || !isUuid(protocolTypeId)) {
    throw new ValidationError("Selecione um tipo de protocolo válido.");
  }

  return { patientId, protocolTypeId, notes };
}

export function validateUpdateProtocolStatus(payload: {
  status?: unknown;
  cancelReason?: unknown;
}) {
  const status = parseProtocolStatus(payload.status);
  if (!status) {
    throw new ValidationError(
      `Status inválido. Valores permitidos: ${PROTOCOL_STATUSES.join(", ")}.`,
    );
  }

  const cancelReason = normalizeText(payload.cancelReason);
  if (status === "CANCELADO" && !cancelReason) {
    throw new ValidationError("Informe a justificativa do cancelamento.");
  }

  return {
    status,
    cancelReason: status === "CANCELADO" ? cancelReason : undefined,
  };
}
