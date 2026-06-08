export const PROTOCOL_REQUEST_TYPES = [
  "DOCUMENTO",
  "TROCA_HORARIO",
  "SEGUNDA_VIA",
  "ENCAMINHAMENTO",
  "CANCELAMENTO",
] as const;

export type ProtocolRequestType = (typeof PROTOCOL_REQUEST_TYPES)[number];

export const PROTOCOL_STATUSES = ["PENDENTE", "CONCLUIDO"] as const;

export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];

export const PROTOCOL_SEQUENCE_DIGITS = 5;
export const PROTOCOL_MAX_SEQUENCE = 10 ** PROTOCOL_SEQUENCE_DIGITS - 1;
