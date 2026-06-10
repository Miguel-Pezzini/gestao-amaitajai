import { ValidationError } from "../../errors/http-errors.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

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

export function validateIsActive(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError("O campo isActive deve ser booleano.");
  }
  return value;
}
