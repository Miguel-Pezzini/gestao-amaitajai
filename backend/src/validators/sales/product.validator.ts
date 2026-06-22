import { ValidationError } from "../../errors/http-errors.js";
import { validateIsActive } from "../agenda/room.validator.js";
import { isUuid, normalizeText } from "../agenda/agenda.utils.js";

export { validateIsActive };

export function validateCreateProductCategory(payload: { name?: unknown }): { name: string } {
  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da categoria é obrigatório.");
  }
  return { name };
}

export function validateUpdateProductCategory(
  categoryId: string,
  payload: { name?: unknown },
): { name?: string } {
  if (!isUuid(categoryId)) {
    throw new ValidationError("Identificador de categoria inválido.");
  }
  if (payload.name === undefined) {
    return {};
  }

  const name = normalizeText(payload.name);
  if (!name) {
    throw new ValidationError("Nome da categoria é obrigatório.");
  }
  return { name };
}

export function validateCategoryId(categoryId: string): void {
  if (!isUuid(categoryId)) {
    throw new ValidationError("Identificador de categoria inválido.");
  }
}

function parseNonNegativeInt(value: unknown, fieldLabel: string): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationError(`${fieldLabel} inválido.`);
  }
  return parsed;
}

function parseOptionalNonNegativeInt(value: unknown, fieldLabel: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return parseNonNegativeInt(value, fieldLabel);
}

export function validateCreateProduct(payload: {
  name?: unknown;
  categoryId?: unknown;
  salePriceCents?: unknown;
  costCents?: unknown;
  stockQty?: unknown;
  minStockQty?: unknown;
}) {
  const name = normalizeText(payload.name);
  const categoryId = normalizeText(payload.categoryId);

  if (!name) {
    throw new ValidationError("Nome do produto é obrigatório.");
  }
  if (!categoryId || !isUuid(categoryId)) {
    throw new ValidationError("Selecione uma categoria válida.");
  }

  const salePriceCents = parseNonNegativeInt(payload.salePriceCents, "Preço de venda");
  const costCents = parseOptionalNonNegativeInt(payload.costCents, "Custo unitário");
  const stockQty = payload.stockQty === undefined ? 0 : parseNonNegativeInt(payload.stockQty, "Estoque");
  const minStockQty =
    payload.minStockQty === undefined ? 0 : parseNonNegativeInt(payload.minStockQty, "Estoque mínimo");

  return { name, categoryId, salePriceCents, costCents, stockQty, minStockQty };
}

export function validateUpdateProduct(
  productId: string,
  payload: {
    name?: unknown;
    categoryId?: unknown;
    salePriceCents?: unknown;
    costCents?: unknown;
    stockQty?: unknown;
    minStockQty?: unknown;
  },
) {
  if (!isUuid(productId)) {
    throw new ValidationError("Identificador de produto inválido.");
  }

  const updates: {
    name?: string;
    categoryId?: string;
    salePriceCents?: number;
    costCents?: number | null;
    stockQty?: number;
    minStockQty?: number;
  } = {};

  if (payload.name !== undefined) {
    const name = normalizeText(payload.name);
    if (!name) {
      throw new ValidationError("Nome do produto é obrigatório.");
    }
    updates.name = name;
  }

  if (payload.categoryId !== undefined) {
    const categoryId = normalizeText(payload.categoryId);
    if (!categoryId || !isUuid(categoryId)) {
      throw new ValidationError("Selecione uma categoria válida.");
    }
    updates.categoryId = categoryId;
  }

  if (payload.salePriceCents !== undefined) {
    updates.salePriceCents = parseNonNegativeInt(payload.salePriceCents, "Preço de venda");
  }

  if (payload.costCents !== undefined) {
    updates.costCents = parseOptionalNonNegativeInt(payload.costCents, "Custo unitário");
  }

  if (payload.stockQty !== undefined) {
    updates.stockQty = parseNonNegativeInt(payload.stockQty, "Estoque");
  }

  if (payload.minStockQty !== undefined) {
    updates.minStockQty = parseNonNegativeInt(payload.minStockQty, "Estoque mínimo");
  }

  return updates;
}

export function validateProductId(productId: string): void {
  if (!isUuid(productId)) {
    throw new ValidationError("Identificador de produto inválido.");
  }
}
