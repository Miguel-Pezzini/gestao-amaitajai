import { ValidationError } from "../../errors/http-errors.js";
import {
  SESSION_MODALITIES,
  type SessionModality,
} from "../../domain/agenda.js";
import { normalizeText } from "./agenda.utils.js";

export function validateSessionModalitySettingUpdate(
  modality: string,
  payload: {
    minPatients?: unknown;
    maxPatients?: unknown;
    minProfessionals?: unknown;
    maxProfessionals?: unknown;
    isActive?: unknown;
  },
) {
  const normalizedModality = normalizeText(modality) as SessionModality;
  if (!SESSION_MODALITIES.includes(normalizedModality)) {
    throw new ValidationError("Tipo de sessão inválido.");
  }

  const minPatients = Number.parseInt(String(payload.minPatients), 10);
  const maxPatients = Number.parseInt(String(payload.maxPatients), 10);
  const minProfessionals = Number.parseInt(String(payload.minProfessionals), 10);
  const maxProfessionals = Number.parseInt(String(payload.maxProfessionals), 10);

  if (
    !Number.isFinite(minPatients) ||
    !Number.isFinite(maxPatients) ||
    !Number.isFinite(minProfessionals) ||
    !Number.isFinite(maxProfessionals)
  ) {
    throw new ValidationError("Informe limites válidos para pacientes e profissionais.");
  }

  if (minPatients <= 0 || maxPatients <= 0 || minProfessionals <= 0 || maxProfessionals <= 0) {
    throw new ValidationError("Os limites devem ser maiores que zero.");
  }

  if (maxPatients < minPatients) {
    throw new ValidationError("Pacientes: máximo deve ser maior ou igual ao mínimo.");
  }

  if (maxProfessionals < minProfessionals) {
    throw new ValidationError("Profissionais: máximo deve ser maior ou igual ao mínimo.");
  }

  const isActive =
    payload.isActive === undefined ? undefined : payload.isActive === true || payload.isActive === false ? payload.isActive : null;
  if (isActive === null) {
    throw new ValidationError("isActive deve ser booleano.");
  }

  return {
    modality: normalizedModality,
    minPatients,
    maxPatients,
    minProfessionals,
    maxProfessionals,
    isActive,
  };
}
