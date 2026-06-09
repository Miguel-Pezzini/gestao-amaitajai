export const USER_ROLES = ["ADMINISTRADOR", "TECNICO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ACCOUNT_STATUSES = ["pendente", "ativo", "inativo"] as const;
export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const FUNDING_SOURCES = ["MUNICIPAL", "ESTADUAL", "PARTICULAR"] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

export const SESSION_MODALITIES = ["INDIVIDUAL", "DUPLA", "GRUPO"] as const;
export type SessionModality = (typeof SESSION_MODALITIES)[number];

export const SESSION_STATUSES = ["AGENDADA", "REALIZADA", "CANCELADA"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_SERIES_STATUSES = ["ativa", "encerrada", "cancelada"] as const;
export type SessionSeriesStatus = (typeof SESSION_SERIES_STATUSES)[number];

export const CANCEL_SCOPES = ["single", "future", "all"] as const;
export type CancelScope = (typeof CANCEL_SCOPES)[number];

export const UPDATE_SCOPES = ["single", "future"] as const;
export type UpdateScope = (typeof UPDATE_SCOPES)[number];

export function buildPatientDeactivatedCancelReason(patientFullName: string): string {
  return `Paciente desativado: ${patientFullName}`;
}
