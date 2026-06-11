import { ValidationError } from "../../errors/http-errors.js";
import { validateIsActive } from "../agenda/room.validator.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

export { validateIsActive };

export function validateCreateProtocolType(payload: { name?: unknown }): { name: string } {
  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome do tipo de protocolo é obrigatório.");
  }
  return { name };
}

export function validateUpdateProtocolType(
  protocolTypeId: string,
  payload: { name?: unknown },
): { name?: string } {
  if (!isUuid(protocolTypeId)) {
    throw new ValidationError("Identificador de tipo de protocolo inválido.");
  }
  if (payload.name === undefined) {
    return {};
  }

  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome do tipo de protocolo é obrigatório.");
  }
  return { name };
}

export function validateProtocolTypeId(protocolTypeId: string): void {
  if (!isUuid(protocolTypeId)) {
    throw new ValidationError("Identificador de tipo de protocolo inválido.");
  }
}
