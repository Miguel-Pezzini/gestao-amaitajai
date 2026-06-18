import {
  PAYMENT_METHODS,
  type PaymentMethod,
  SALE_STATUSES,
} from "../../domain/sales.js";
import { ValidationError } from "../../errors/http-errors.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  const raw = normalizeText(value).toUpperCase();
  return PAYMENT_METHODS.find((item) => item === raw) ?? null;
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export function validateCreateSale(payload: {
  paymentMethod?: unknown;
  notes?: unknown;
  buyerName?: unknown;
  promisedPayAt?: unknown;
  items?: unknown;
}) {
  const paymentMethod = parsePaymentMethod(payload.paymentMethod);
  if (!paymentMethod) {
    throw new ValidationError(
      `Forma de pagamento inválida. Valores permitidos: ${PAYMENT_METHODS.join(", ")}.`,
    );
  }

  const notes = normalizeText(payload.notes);
  const buyerName = normalizeText(payload.buyerName) || null;
  const promisedPayAtRaw = normalizeText(payload.promisedPayAt);
  let promisedPayAt: Date | null = null;

  if (promisedPayAtRaw) {
    const parsed = new Date(promisedPayAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError("Data prevista de pagamento inválida.");
    }
    promisedPayAt = parsed;
  }

  if (paymentMethod === "FIADO") {
    if (!buyerName) {
      throw new ValidationError("Informe o nome do cliente para venda fiada.");
    }
    if (!promisedPayAt) {
      throw new ValidationError("Informe a data prevista de pagamento para venda fiada.");
    }
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ValidationError("Adicione ao menos um item à venda.");
  }

  const items: SaleItemInput[] = payload.items.map((raw, index) => {
    const item = raw as { productId?: unknown; quantity?: unknown };
    const productId = normalizeText(item.productId);
    const quantity = Number.parseInt(String(item.quantity), 10);

    if (!productId || !isUuid(productId)) {
      throw new ValidationError(`Item ${index + 1}: produto inválido.`);
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new ValidationError(`Item ${index + 1}: quantidade inválida.`);
    }

    return { productId, quantity };
  });

  return { paymentMethod, notes, buyerName, promisedPayAt, items };
}

export function validateCancelSale(payload: { cancelReason?: unknown }) {
  const cancelReason = normalizeText(payload.cancelReason);
  if (!cancelReason) {
    throw new ValidationError("Informe a justificativa do cancelamento.");
  }
  return { cancelReason };
}

export function validateReceivePayment(payload: { amountCents?: unknown }) {
  const amountCents = Number.parseInt(String(payload.amountCents), 10);
  if (!Number.isFinite(amountCents) || amountCents < 1) {
    throw new ValidationError("Valor do pagamento inválido.");
  }
  return { amountCents };
}

export function validateSaleId(saleId: string): void {
  if (!isUuid(saleId)) {
    throw new ValidationError("Identificador de venda inválido.");
  }
}

export function parseSaleStatusFilter(value: unknown): string | null {
  const raw = normalizeText(value).toUpperCase();
  if (!raw) {
    return null;
  }
  return SALE_STATUSES.includes(raw as (typeof SALE_STATUSES)[number]) ? raw : null;
}
