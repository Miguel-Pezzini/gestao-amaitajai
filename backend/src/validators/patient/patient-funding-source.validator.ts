import { ValidationError } from "../../errors/http-errors.js";
import { validateIsActive } from "../agenda/room.validator.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

export { validateIsActive };

export function validateCreatePatientFundingSource(payload: { name?: unknown }): { name: string } {
  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da fonte de custeio é obrigatório.");
  }
  return { name };
}

export function validateUpdatePatientFundingSource(
  fundingSourceId: string,
  payload: { name?: unknown },
): { name?: string } {
  if (!isUuid(fundingSourceId)) {
    throw new ValidationError("Identificador de fonte de custeio inválido.");
  }
  if (payload.name === undefined) {
    return {};
  }

  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da fonte de custeio é obrigatório.");
  }
  return { name };
}

export function validatePatientFundingSourceId(fundingSourceId: string): void {
  if (!isUuid(fundingSourceId)) {
    throw new ValidationError("Identificador de fonte de custeio inválido.");
  }
}
