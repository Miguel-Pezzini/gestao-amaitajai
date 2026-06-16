import { ValidationError } from "../errors/http-errors.js";

export const PATIENT_EVOLUTION_MAX_CONTENT_LENGTH = 10_000;

export function validateEvolutionContent(content: unknown): string {
  if (typeof content !== "string") {
    throw new ValidationError("O conteúdo da evolução deve ser texto.");
  }

  const normalized = content.trim();
  if (normalized.length > PATIENT_EVOLUTION_MAX_CONTENT_LENGTH) {
    throw new ValidationError(
      `A evolução deve ter no máximo ${PATIENT_EVOLUTION_MAX_CONTENT_LENGTH} caracteres.`,
    );
  }

  return normalized;
}
