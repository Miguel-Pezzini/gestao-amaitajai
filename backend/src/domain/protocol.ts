export const PROTOCOL_STATUSES = ["PENDENTE", "CONCLUIDO", "CANCELADO"] as const;

export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];

export const PROTOCOL_SEQUENCE_DIGITS = 5;
export const PROTOCOL_MAX_SEQUENCE = 10 ** PROTOCOL_SEQUENCE_DIGITS - 1;
