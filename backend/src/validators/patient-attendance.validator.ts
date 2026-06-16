import type { SessionAttendanceStatus } from "@prisma/client";
import { ValidationError } from "../errors/http-errors.js";

export const PATIENT_ATTENDANCE_MAX_JUSTIFICATION_LENGTH = 2_000;

const VALID_STATUSES: SessionAttendanceStatus[] = ["PRESENTE", "FALTA", "FALTA_JUSTIFICADA"];

export function validateAttendanceStatus(status: unknown): SessionAttendanceStatus {
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as SessionAttendanceStatus)) {
    throw new ValidationError("O status de presença deve ser PRESENTE, FALTA ou FALTA_JUSTIFICADA.");
  }

  return status as SessionAttendanceStatus;
}

export function validateAttendanceJustification(
  justification: unknown,
  status: SessionAttendanceStatus,
): string {
  if (typeof justification !== "string") {
    throw new ValidationError("A justificativa deve ser texto.");
  }

  const normalized = justification.trim();

  if (status === "FALTA_JUSTIFICADA") {
    if (!normalized) {
      throw new ValidationError("A justificativa é obrigatória para falta justificada.");
    }
    if (normalized.length > PATIENT_ATTENDANCE_MAX_JUSTIFICATION_LENGTH) {
      throw new ValidationError(
        `A justificativa deve ter no máximo ${PATIENT_ATTENDANCE_MAX_JUSTIFICATION_LENGTH} caracteres.`,
      );
    }
    return normalized;
  }

  if (normalized) {
    throw new ValidationError("A justificativa só é permitida para falta justificada.");
  }

  return "";
}

export function validateAttendancePayload(payload: Record<string, unknown>): {
  status: SessionAttendanceStatus;
  justification: string;
} {
  const status = validateAttendanceStatus(payload.status);
  const justification = validateAttendanceJustification(
    payload.justification ?? "",
    status,
  );
  return { status, justification };
}
