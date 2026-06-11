import {
  MODALITY_OPTIONS,
  SESSION_FORMAT_LABELS,
  SESSION_FORMAT_OPTIONS,
} from "@/features/cadastros/constants";

import {
  defaultRecurrenceEndsAt,
  getWeekdayFromDateString,
} from "@/features/agenda/utils/recurrence";
import { splitStartDateTime, combineStartDateTime } from "@/features/agenda/utils";
import {
  OCCUPANCY_START_HOUR,
  OCCUPANCY_TOTAL_SLOTS,
} from "@/features/room-occupancy/constants";

/** Horário inicial ao abrir o diálogo de nova sessão (alinhado ao início da grade). */
export const DEFAULT_SESSION_START_TIME = `${String(OCCUPANCY_START_HOUR).padStart(2, "0")}:00`;

/** Mínimo de caracteres para buscar paciente/profissional com disponibilidade no horário. */
export const PARTICIPANT_SEARCH_MIN_LENGTH = 2;

export const STATUS_OPTIONS = ["AGENDADA", "REALIZADA", "CANCELADA"];

export const AGENDA_VIEW_MODES = {
  MONTH: "month",
  WEEK: "week",
  DAY: "day",
};

export const AGENDA_VIEW_MODE_OPTIONS = [
  { value: AGENDA_VIEW_MODES.MONTH, label: "Mês" },
  { value: AGENDA_VIEW_MODES.WEEK, label: "Semana" },
  { value: AGENDA_VIEW_MODES.DAY, label: "Dia" },
];

/** Grade horária (8h–18h): altura maior que ocupação de salas para melhor leitura. */
export const AGENDA_TIME_GRID_SLOT_HEIGHT_PX = 20;
export const AGENDA_TIME_GRID_HEIGHT_PX =
  OCCUPANCY_TOTAL_SLOTS * AGENDA_TIME_GRID_SLOT_HEIGHT_PX;
export const AGENDA_TIME_GRID_HOUR_COLUMN_REM = 4;
export const AGENDA_TIME_GRID_DAY_COLUMN_MIN_REM = 7;

/** Campo API `modality` — tipo de sessão (individual, dupla, grupo). */
export { MODALITY_OPTIONS, SESSION_FORMAT_LABELS, SESSION_FORMAT_OPTIONS };

/** Limites por tipo de sessão (campo API `modality`). */
export const SESSION_FORMAT_LIMITS = {
  INDIVIDUAL: { minPatients: 1, maxPatients: 1, minProfessionals: 1, maxProfessionals: 1 },
  DUPLA: { minPatients: 2, maxPatients: 2, minProfessionals: 2, maxProfessionals: 2 },
  GRUPO: { minPatients: 1, maxPatients: 15, minProfessionals: 2, maxProfessionals: 4 },
};

export function buildSessionLimitsMap(settings = []) {
  if (!Array.isArray(settings) || settings.length === 0) {
    return SESSION_FORMAT_LIMITS;
  }

  const dynamic = {};
  settings.forEach((item) => {
    if (!item?.modality) return;
    dynamic[item.modality] = {
      minPatients: Number(item.minPatients),
      maxPatients: Number(item.maxPatients),
      minProfessionals: Number(item.minProfessionals),
      maxProfessionals: Number(item.maxProfessionals),
    };
  });
  return { ...SESSION_FORMAT_LIMITS, ...dynamic };
}

export function getSessionFormatHint(modality, limitsByModality = SESSION_FORMAT_LIMITS) {
  const limits = limitsByModality[modality];
  if (!limits) {
    return "";
  }

  const patients =
    limits.minPatients === limits.maxPatients
      ? `${limits.minPatients} paciente(s)`
      : `${limits.minPatients} a ${limits.maxPatients} pacientes`;
  const professionals =
    limits.minProfessionals === limits.maxProfessionals
      ? `${limits.minProfessionals} profissional(is)`
      : `${limits.minProfessionals} a ${limits.maxProfessionals} profissionais`;

  const label = SESSION_FORMAT_LABELS[modality] ?? modality;
  return `${label}: ${patients} e ${professionals}.`;
}

export function canAddSessionPatient(modality, currentCount, limitsByModality = SESSION_FORMAT_LIMITS) {
  const limits = limitsByModality[modality];
  if (!limits) {
    return true;
  }
  return currentCount < limits.maxPatients;
}

export function canAddSessionProfessional(modality, currentCount, limitsByModality = SESSION_FORMAT_LIMITS) {
  const limits = limitsByModality[modality];
  if (!limits) {
    return true;
  }
  return currentCount < limits.maxProfessionals;
}

export function getParticipantCountLabels(
  modality,
  patientCount,
  professionalCount,
  limitsByModality = SESSION_FORMAT_LIMITS,
) {
  const limits = limitsByModality[modality];
  if (!limits) {
    return { patients: "", professionals: "" };
  }

  const patients =
    limits.minPatients === limits.maxPatients
      ? `${patientCount}/${limits.maxPatients}`
      : `${patientCount}/${limits.minPatients}–${limits.maxPatients}`;
  const professionals =
    limits.minProfessionals === limits.maxProfessionals
      ? `${professionalCount}/${limits.maxProfessionals}`
      : `${professionalCount}/${limits.minProfessionals}–${limits.maxProfessionals}`;

  return { patients, professionals };
}

export function getParticipantFieldErrors(
  modality,
  patientCount,
  professionalCount,
  limitsByModality = SESSION_FORMAT_LIMITS,
) {
  const limits = limitsByModality[modality];
  const errors = {};
  if (!limits) {
    return errors;
  }

  const label = SESSION_FORMAT_LABELS[modality] ?? modality;

  if (patientCount < limits.minPatients || patientCount > limits.maxPatients) {
    if (limits.minPatients === limits.maxPatients) {
      errors.patients = `Para tipo de sessão ${label}, selecione exatamente ${limits.minPatients} paciente(s).`;
    } else {
      errors.patients = `Para tipo de sessão ${label}, selecione entre ${limits.minPatients} e ${limits.maxPatients} pacientes.`;
    }
  }

  if (
    professionalCount < limits.minProfessionals ||
    professionalCount > limits.maxProfessionals
  ) {
    if (limits.minProfessionals === limits.maxProfessionals) {
      errors.professionals = `Para tipo de sessão ${label}, selecione exatamente ${limits.minProfessionals} profissional(is).`;
    } else {
      errors.professionals = `Para tipo de sessão ${label}, selecione entre ${limits.minProfessionals} e ${limits.maxProfessionals} profissionais.`;
    }
  }

  return errors;
}

export function getSessionFormFieldErrors(form, limitsByModality = SESSION_FORMAT_LIMITS) {
  const errors = {};

  if (!form.sessionTypeId) {
    errors.sessionTypeId = "Selecione a modalidade de atendimento.";
  }
  if (!form.roomId) {
    errors.roomId = "Selecione a sala.";
  }
  if (!form.startDate || !form.startTime) {
    errors.startAt = "Informe data e hora de início.";
  }

  const durationMinutes = Number.parseInt(form.durationMinutes, 10);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    errors.durationMinutes = "Informe uma duração válida em minutos.";
  }

  const participantErrors = getParticipantFieldErrors(
    form.modality,
    form.selectedPatients.length,
    form.selectedProfessionals.length,
    limitsByModality,
  );

  if (form.selectedPatients.length === 0 && !participantErrors.patients) {
    errors.patients = "Adicione ao menos um paciente.";
  }
  if (form.selectedProfessionals.length === 0 && !participantErrors.professionals) {
    errors.professionals = "Adicione ao menos um profissional.";
  }

  if (form.recurrenceEnabled) {
    if (!Array.isArray(form.recurrenceWeekdays) || form.recurrenceWeekdays.length === 0) {
      errors.recurrenceWeekdays = "Selecione ao menos um dia da semana.";
    }
    if (!form.recurrenceEndsAt) {
      errors.recurrenceEndsAt = "Informe a data final da recorrência.";
    } else if (form.startDate && form.recurrenceEndsAt < form.startDate) {
      errors.recurrenceEndsAt = "A data final deve ser igual ou posterior ao início.";
    }
  }

  if (form.modality === "GRUPO") {
    const apoioErrors = getApoioFieldErrors(form);
    Object.assign(errors, apoioErrors);
  }

  return { ...errors, ...participantErrors };
}

function getSessionEndTime(form) {
  const durationMinutes = Number.parseInt(form.durationMinutes, 10);
  if (!form.startDate || !form.startTime || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }

  const startAt = new Date(combineStartDateTime(form.startDate, form.startTime));
  if (Number.isNaN(startAt.getTime())) {
    return null;
  }

  const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  const hours = String(endAt.getHours()).padStart(2, "0");
  const minutes = String(endAt.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function suggestApoioEndTime(form, rosterConflict) {
  const sessionEnd = getSessionEndTime(form);
  if (!sessionEnd || !rosterConflict?.startAt) {
    return sessionEnd ?? "";
  }

  const conflictStart = splitStartDateTime(rosterConflict.startAt).startTime;
  const sessionStart = form.startTime;
  if (
    sessionStart &&
    conflictStart &&
    conflictStart > sessionStart &&
    conflictStart <= sessionEnd
  ) {
    return conflictStart;
  }

  return sessionEnd;
}

export function getApoioFieldErrors(form) {
  const errors = {};
  const sessionStart = form.startTime;
  const sessionEnd = getSessionEndTime(form);

  form.selectedProfessionals.forEach((professional) => {
    const key = `apoio_${professional.id}`;

    if (professional.rosterConflict && !professional.isApoio) {
      errors[key] = "Marque Apoio e defina horário compatível com a agenda do profissional.";
      return;
    }

    if (!professional.isApoio) {
      return;
    }

    if (!professional.participationStartTime || !professional.participationEndTime) {
      errors[key] = "Informe horário de entrada e saída do apoio.";
      return;
    }

    if (sessionStart && professional.participationStartTime < sessionStart) {
      errors[key] = "Entrada do apoio não pode ser anterior ao início da sessão.";
      return;
    }

    if (sessionEnd && professional.participationEndTime > sessionEnd) {
      errors[key] = "Saída do apoio não pode ser posterior ao fim da sessão.";
      return;
    }

    if (professional.participationStartTime >= professional.participationEndTime) {
      errors[key] = "Saída do apoio deve ser posterior à entrada.";
    }
  });

  return errors;
}

export function buildSessionProfessionalsPayload(form) {
  return form.selectedProfessionals.map((professional) => {
    const payload = {
      professionalId: professional.id,
      isApoio: Boolean(professional.isApoio),
    };

    if (professional.isApoio) {
      payload.participationStartAt = new Date(
        combineStartDateTime(form.startDate, professional.participationStartTime),
      ).toISOString();
      payload.participationEndAt = new Date(
        combineStartDateTime(form.startDate, professional.participationEndTime),
      ).toISOString();
    }

    return payload;
  });
}

export function createSelectedProfessional(option) {
  return {
    id: option._id ?? option.id,
    label: option.label ?? `${option.name}${option.role ? ` (${option.role})` : ""}`,
    isApoio: false,
    participationStartTime: "",
    participationEndTime: "",
    apoioFieldError: "",
    apoioConflict: null,
    rosterConflict: option.rosterConflict ?? null,
  };
}

export const EMPTY_FORM = {
  sessionTypeId: "",
  modality: "INDIVIDUAL",
  roomId: "",
  startDate: "",
  startTime: "",
  durationMinutes: "60",
  notes: "",
  selectedPatients: [],
  selectedProfessionals: [],
  recurrenceEnabled: false,
  recurrenceWeekdays: [],
  recurrenceEndsAt: "",
};

export function pickDefaultCatalogId(items) {
  const active = items.find((item) => item.isActive !== false);
  return active?._id ?? items[0]?._id ?? "";
}

/** Preenche modalidade e sala com o primeiro item ativo (evita select “preenchido” com state vazio). */
export function buildInitialSessionForm(sessionTypes = [], rooms = [], overrides = {}) {
  const startDate = overrides.startDate ?? "";
  const weekday = getWeekdayFromDateString(startDate);
  return {
    ...EMPTY_FORM,
    sessionTypeId: pickDefaultCatalogId(sessionTypes),
    roomId: pickDefaultCatalogId(rooms),
    ...overrides,
    recurrenceEndsAt: overrides.recurrenceEndsAt ?? defaultRecurrenceEndsAt(startDate),
    recurrenceWeekdays:
      overrides.recurrenceWeekdays ?? (weekday !== null ? [weekday] : []),
  };
}

export function buildSessionFormFromSession(session) {
  const { startDate, startTime } = splitStartDateTime(session?.startAt);
  const sessionTypeRef = session?.sessionTypeId;
  const roomRef = session?.roomId;

  return {
    ...EMPTY_FORM,
    sessionTypeId: sessionTypeRef?._id ?? sessionTypeRef ?? "",
    modality: session?.modality ?? "INDIVIDUAL",
    roomId: roomRef?._id ?? roomRef ?? "",
    startDate,
    startTime,
    durationMinutes: String(session?.durationMinutes ?? 60),
    notes: session?.notes ?? "",
    selectedPatients: (session?.patientIds ?? []).map((patient) => ({
      id: patient._id ?? patient.id ?? patient,
      label: patient.fullName ?? patient.label ?? "Paciente",
    })),
    selectedProfessionals: (session?.professionalIds ?? []).map((professional) => {
      const participationStartTime = professional.participationStartAt
        ? splitStartDateTime(professional.participationStartAt).startTime
        : "";
      const participationEndTime = professional.participationEndAt
        ? splitStartDateTime(professional.participationEndAt).startTime
        : "";

      return {
        id: professional._id ?? professional.id ?? professional,
        label: professional.name
          ? `${professional.name}${professional.role ? ` (${professional.role})` : ""}`
          : professional.label ?? "Profissional",
        isApoio: Boolean(professional.isApoio),
        participationStartTime: professional.isApoio ? participationStartTime : "",
        participationEndTime: professional.isApoio ? participationEndTime : "",
        apoioFieldError: "",
        apoioConflict: null,
        rosterConflict: null,
      };
    }),
  };
}
