import { ValidationError } from "../../errors/http-errors.js";
import {
  CANCEL_SCOPES,
  type CancelScope,
  UPDATE_SCOPES,
  type UpdateScope,
} from "../../domain/agenda.js";
import { defaultSeriesEndsAt } from "../../services/session-recurrence.helpers.js";
import { isUuid, normalizeText, parseDate } from "./agenda.utils.js";

export { CANCEL_SCOPES, UPDATE_SCOPES };
export type { CancelScope, UpdateScope };

export type RecurrenceInput = {
  enabled: boolean;
  weekdays: number[];
  endsAt: Date | null;
};

function parseWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const weekdays: number[] = [];
  for (const item of value) {
    const parsed = Number.parseInt(String(item), 10);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
      continue;
    }
    if (!weekdays.includes(parsed)) {
      weekdays.push(parsed);
    }
  }
  return weekdays.sort((a, b) => a - b);
}

export function parseRecurrenceInput(
  payload: { recurrence?: unknown },
  startAt: Date | null,
): RecurrenceInput {
  const raw = payload.recurrence;
  if (!raw || typeof raw !== "object") {
    return { enabled: false, weekdays: [], endsAt: null };
  }

  const recurrence = raw as {
    enabled?: unknown;
    weekdays?: unknown;
    endsAt?: unknown;
  };
  const enabled = recurrence.enabled === true || recurrence.enabled === "true";
  if (!enabled) {
    return { enabled: false, weekdays: [], endsAt: null };
  }

  const weekdays = parseWeekdays(recurrence.weekdays);
  const endsAt = parseDate(recurrence.endsAt) ?? (startAt ? defaultSeriesEndsAt(startAt) : null);

  return { enabled: true, weekdays, endsAt };
}

export function validateRecurrenceInput(
  recurrence: RecurrenceInput,
  startAt: Date | null,
): { weekdays: number[]; endsAt: Date } {
  if (!recurrence.enabled) {
    throw new ValidationError("Recorrência inválida.");
  }
  if (!startAt) {
    throw new ValidationError("Informe data e hora de início para sessão recorrente.");
  }
  if (recurrence.weekdays.length === 0) {
    throw new ValidationError("Selecione ao menos um dia da semana para a recorrência.");
  }
  if (!recurrence.endsAt) {
    throw new ValidationError("Informe a data final da recorrência.");
  }

  const startsAtDate = new Date(startAt);
  startsAtDate.setHours(0, 0, 0, 0);
  const endsAtDate = new Date(recurrence.endsAt);
  endsAtDate.setHours(0, 0, 0, 0);

  if (endsAtDate < startsAtDate) {
    throw new ValidationError("A data final da recorrência deve ser igual ou posterior ao início.");
  }

  return { weekdays: recurrence.weekdays, endsAt: recurrence.endsAt };
}

function validateScope(value: unknown, invalidMessage: string): CancelScope {
  const scope = (normalizeText(value) || "SINGLE").toUpperCase();
  if (!CANCEL_SCOPES.includes(scope as CancelScope)) {
    throw new ValidationError(invalidMessage);
  }
  return scope as CancelScope;
}

export function validateCancelScope(value: unknown): CancelScope {
  return validateScope(value, "Escopo de cancelamento inválido.");
}

export function validateUpdateScope(value: unknown): UpdateScope {
  return validateScope(value, "Escopo de edição inválido.");
}

export function validatePatientId(patientId: string): void {
  if (!isUuid(patientId)) {
    throw new ValidationError("Identificador de paciente inválido.");
  }
}
