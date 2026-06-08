export const USER_ROLES = ["ADMINISTRADOR", "TECNICO"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const FUNDING_SOURCES = ["MUNICIPAL", "ESTADUAL", "PARTICULAR"] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

export const SESSION_MODALITIES = ["INDIVIDUAL", "DUPLA", "GRUPO"] as const;
export type SessionModality = (typeof SESSION_MODALITIES)[number];

export const SESSION_STATUSES = ["AGENDADA", "REALIZADA", "CANCELADA"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
