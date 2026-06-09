import { ValidationError } from "../errors/http-errors.js";
import { isUuid } from "./agenda/agenda.utils.js";

export type PatientDeactivationReplacementInput = {
  seriesId?: string;
  sessionId?: string;
  replacementPatientId: string;
};

export function validatePatientDeactivationReplacements(
  payload: unknown,
): PatientDeactivationReplacementInput[] {
  if (payload === undefined || payload === null) {
    return [];
  }

  if (!Array.isArray(payload)) {
    throw new ValidationError("Substituições de paciente inválidas.");
  }

  return payload.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new ValidationError(`Substituição ${index + 1} inválida.`);
    }

    const raw = item as {
      seriesId?: unknown;
      sessionId?: unknown;
      replacementPatientId?: unknown;
    };
    const seriesId =
      typeof raw.seriesId === "string" && isUuid(raw.seriesId) ? raw.seriesId : undefined;
    const sessionId =
      typeof raw.sessionId === "string" && isUuid(raw.sessionId) ? raw.sessionId : undefined;
    const replacementPatientId =
      typeof raw.replacementPatientId === "string" && isUuid(raw.replacementPatientId)
        ? raw.replacementPatientId
        : "";

    if (!replacementPatientId) {
      throw new ValidationError(`Informe o paciente substituto na substituição ${index + 1}.`);
    }

    if (Boolean(seriesId) === Boolean(sessionId)) {
      throw new ValidationError(
        `Substituição ${index + 1} deve referenciar uma série ou uma sessão isolada.`,
      );
    }

    return {
      seriesId,
      sessionId,
      replacementPatientId,
    };
  });
}
