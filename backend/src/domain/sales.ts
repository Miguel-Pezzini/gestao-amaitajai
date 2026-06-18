export const PAYMENT_METHODS = ["PIX", "DINHEIRO", "DEBITO", "CREDITO", "FIADO"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SALE_STATUSES = ["REGISTRADA", "FIADO_PENDENTE", "QUITADA", "CANCELADA"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export const SALE_MAX_SEQUENCE = 99_999;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  FIADO: "Fiado",
};
