export const USER_ROLES = ["ADMINISTRADOR", "TECNICO", "RECEPCAO", "OPERADOR"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ACCOUNT_STATUSES = ["PENDENTE", "ATIVO", "INATIVO"] as const;
export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const SESSION_MODALITIES = ["INDIVIDUAL", "DUPLA", "GRUPO"] as const;
export type SessionModality = (typeof SESSION_MODALITIES)[number];

export const SESSION_STATUSES = ["AGENDADA", "REALIZADA", "CANCELADA"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_SERIES_STATUSES = ["ATIVA", "ENCERRADA", "CANCELADA"] as const;
export type SessionSeriesStatus = (typeof SESSION_SERIES_STATUSES)[number];

export const CANCEL_SCOPES = ["SINGLE", "FUTURE", "ALL"] as const;
export type CancelScope = (typeof CANCEL_SCOPES)[number];

export const UPDATE_SCOPES = CANCEL_SCOPES;
export type UpdateScope = CancelScope;

export const SESSION_FORMAT_LABELS: Record<SessionModality, string> = {
  INDIVIDUAL: "Individual",
  DUPLA: "Dupla",
  GRUPO: "Grupo",
};

export function buildPatientDeactivatedCancelReason(patientFullName: string): string {
  return `Paciente desativado: ${patientFullName}`;
}
