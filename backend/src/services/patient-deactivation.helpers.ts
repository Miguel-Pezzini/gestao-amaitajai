import type { SessionModality } from "../domain/agenda.js";

export function shouldCancelSessionOnPatientDeactivation(
  modality: SessionModality,
  patientCountInSession: number,
): boolean {
  if (modality === "individual") {
    return true;
  }

  if (modality === "dupla") {
    return false;
  }

  return patientCountInSession <= 1;
}

export function requiresPatientReplacementOnDeactivation(
  modality: SessionModality,
  patientCountInSession: number,
): boolean {
  if (modality === "individual") {
    return false;
  }

  if (modality === "dupla") {
    return true;
  }

  return patientCountInSession > 1;
}

export function buildReplacementKey(params: { seriesId?: string | null; sessionId?: string }) {
  if (params.seriesId) {
    return `series:${params.seriesId}`;
  }
  return `session:${params.sessionId}`;
}
