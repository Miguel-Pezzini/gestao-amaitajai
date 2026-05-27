import {
  MODALITY_OPTIONS,
  SESSION_FORMAT_LABELS,
  SESSION_FORMAT_OPTIONS,
} from "@/features/cadastros/constants";

export const STATUS_OPTIONS = ["agendada", "realizada", "cancelada"];

/** Campo API `modality` — tipo de sessão (individual, dupla, grupo). */
export { MODALITY_OPTIONS, SESSION_FORMAT_LABELS, SESSION_FORMAT_OPTIONS };

/** Limites por tipo de sessão (campo API `modality`). */
export const SESSION_FORMAT_LIMITS = {
  individual: { minPatients: 1, maxPatients: 1, minProfessionals: 1, maxProfessionals: 1 },
  dupla: { minPatients: 2, maxPatients: 2, minProfessionals: 2, maxProfessionals: 2 },
  grupo: { minPatients: 1, maxPatients: 15, minProfessionals: 2, maxProfessionals: 4 },
};

export function getSessionFormatHint(modality) {
  const limits = SESSION_FORMAT_LIMITS[modality];
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

export function canAddSessionPatient(modality, currentCount) {
  const limits = SESSION_FORMAT_LIMITS[modality];
  if (!limits) {
    return true;
  }
  return currentCount < limits.maxPatients;
}

export function canAddSessionProfessional(modality, currentCount) {
  const limits = SESSION_FORMAT_LIMITS[modality];
  if (!limits) {
    return true;
  }
  return currentCount < limits.maxProfessionals;
}

export function getParticipantCountLabels(modality, patientCount, professionalCount) {
  const limits = SESSION_FORMAT_LIMITS[modality];
  if (!limits) {
    return { patients: "", professionals: "" };
  }

  const patients =
    limits.minPatients === limits.maxPatients
      ? `${patientCount}/${limits.maxPatients} pacientes`
      : `${patientCount} de ${limits.minPatients}–${limits.maxPatients} pacientes`;
  const professionals =
    limits.minProfessionals === limits.maxProfessionals
      ? `${professionalCount}/${limits.maxProfessionals} profissionais`
      : `${professionalCount} de ${limits.minProfessionals}–${limits.maxProfessionals} profissionais`;

  return { patients, professionals };
}

export function getParticipantFieldErrors(modality, patientCount, professionalCount) {
  const limits = SESSION_FORMAT_LIMITS[modality];
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

export function getSessionFormFieldErrors(form) {
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
  );

  if (form.selectedPatients.length === 0 && !participantErrors.patients) {
    errors.patients = "Adicione ao menos um paciente.";
  }
  if (form.selectedProfessionals.length === 0 && !participantErrors.professionals) {
    errors.professionals = "Adicione ao menos um profissional.";
  }

  return { ...errors, ...participantErrors };
}

export const EMPTY_FORM = {
  sessionTypeId: "",
  modality: "individual",
  roomId: "",
  startDate: "",
  startTime: "",
  durationMinutes: "60",
  notes: "",
  selectedPatients: [],
  selectedProfessionals: [],
};

export function pickDefaultCatalogId(items) {
  const active = items.find((item) => item.isActive !== false);
  return active?._id ?? items[0]?._id ?? "";
}

/** Preenche modalidade e sala com o primeiro item ativo (evita select “preenchido” com state vazio). */
export function buildInitialSessionForm(sessionTypes = [], rooms = [], overrides = {}) {
  return {
    ...EMPTY_FORM,
    sessionTypeId: pickDefaultCatalogId(sessionTypes),
    roomId: pickDefaultCatalogId(rooms),
    ...overrides,
  };
}
