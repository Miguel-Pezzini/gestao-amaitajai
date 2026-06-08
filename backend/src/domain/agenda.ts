export const USER_ROLES = ["administrador", "tecnico"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ACCOUNT_STATUSES = ["pendente", "ativo", "inativo"] as const;
export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const FUNDING_SOURCES = ["Municipal", "Estadual", "Particular"] as const;
export type FundingSource = (typeof FUNDING_SOURCES)[number];

export const SESSION_MODALITIES = ["individual", "dupla", "grupo"] as const;
export type SessionModality = (typeof SESSION_MODALITIES)[number];

export const SESSION_STATUSES = ["agendada", "realizada", "cancelada"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
