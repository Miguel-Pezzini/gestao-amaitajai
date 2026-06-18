import type { Prisma, SaleStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { serializePopulatedNameRef } from "../db/serialize.js";
import { SALE_MAX_SEQUENCE } from "../domain/sales.js";
import type { AuthUser } from "../types/express.js";
import { ConflictError, NotFoundError, ValidationError } from "../errors/http-errors.js";
import { containsInsensitive } from "../validators/agenda/agenda.utils.js";
import {
  validateCancelSale,
  validateCreateSale,
  validateReceivePayment,
  validateSaleId,
  type SaleItemInput,
} from "../validators/sales/sale.validator.js";

const saleInclude = {
  createdBy: { select: { id: true, name: true } },
  items: {
    include: {
      product: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.SaleInclude;

function getCurrentYearBase(): number {
  return new Date().getFullYear() * 100_000;
}

async function generateNextSaleNumber(tx: Prisma.TransactionClient): Promise<number> {
  const yearBase = getCurrentYearBase();
  const yearMax = yearBase + SALE_MAX_SEQUENCE;

  const latest = await tx.sale.findFirst({
    where: {
      saleNumber: {
        gte: yearBase,
        lte: yearMax,
      },
    },
    orderBy: { saleNumber: "desc" },
    select: { saleNumber: true },
  });

  const nextSequence = latest ? latest.saleNumber - yearBase + 1 : 1;
  if (nextSequence > SALE_MAX_SEQUENCE) {
    throw new ConflictError(`Limite anual de vendas atingido para ${new Date().getFullYear()}.`);
  }

  return yearBase + nextSequence;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDateFilter(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const parsed = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeSaleItem(
  item: Prisma.SaleItemGetPayload<{
    include: { product: { select: { id: true; name: true } } };
  }>,
) {
  const { id, productId, product, ...rest } = item;
  return {
    ...rest,
    _id: id,
    productId,
    product: serializePopulatedNameRef(product),
  };
}

function serializeSale(record: Prisma.SaleGetPayload<{ include: typeof saleInclude }>) {
  const { id, createdById, createdBy, items, ...rest } = record;
  return {
    ...rest,
    _id: id,
    createdById,
    createdBy: createdBy ? { _id: createdBy.id, name: createdBy.name } : null,
    items: items.map(serializeSaleItem),
    pendingCents: Math.max(0, rest.totalCents - rest.amountPaidCents),
  };
}

interface ResolvedSaleLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  sortOrder: number;
}

export class SaleService {
  async listSales(query: Record<string, unknown> = {}) {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 20), 100);
    const skip = (page - 1) * limit;
    const search = String(query.search ?? "").trim();
    const paymentMethod = String(query.paymentMethod ?? "").trim().toUpperCase();
    const status = String(query.status ?? "").trim().toUpperCase() as SaleStatus | "";
    const dateFrom = parseDateFilter(query.dateFrom);
    const dateTo = parseDateFilter(query.dateTo);

    const soldAtFilter: Prisma.DateTimeFilter | undefined =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo
              ? { lt: new Date(dateTo.getTime() + 24 * 60 * 60 * 1000) }
              : {}),
          }
        : undefined;

    const where: Prisma.SaleWhereInput = {
      ...(soldAtFilter ? { soldAt: soldAtFilter } : {}),
      ...(paymentMethod ? { paymentMethod: paymentMethod as Prisma.SaleWhereInput["paymentMethod"] } : {}),
      ...(status ? { status: status as SaleStatus } : {}),
      ...(search
        ? {
            OR: [
              ...(Number.isFinite(Number.parseInt(search, 10))
                ? [{ saleNumber: Number.parseInt(search, 10) }]
                : []),
              { buyerName: containsInsensitive(search) },
              { notes: containsInsensitive(search) },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: saleInclude,
        orderBy: [{ soldAt: "desc" }, { saleNumber: "desc" }],
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      items: rows.map(serializeSale),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listFiados() {
    const rows = await prisma.sale.findMany({
      where: {
        paymentMethod: "FIADO",
        status: { in: ["FIADO_PENDENTE"] },
      },
      include: saleInclude,
      orderBy: [{ promisedPayAt: "asc" }, { soldAt: "desc" }],
    });

    const items = rows.map(serializeSale);
    const totalPendingCents = items.reduce((sum, item) => sum + item.pendingCents, 0);

    return { items, totalPendingCents };
  }

  async getSale(saleId: string) {
    validateSaleId(saleId);
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: saleInclude,
    });
    if (!sale) {
      throw new NotFoundError("Venda não encontrada.");
    }
    return { sale: serializeSale(sale) };
  }

  async createSale(payload: Record<string, unknown>, currentUser: AuthUser) {
    const input = validateCreateSale(payload);
    const lines = await this.resolveSaleLines(input.items);

    const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const status = input.paymentMethod === "FIADO" ? "FIADO_PENDENTE" : "REGISTRADA";

    const sale = await prisma.$transaction(async (tx) => {
      const saleNumber = await generateNextSaleNumber(tx);

      for (const line of lines) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            stockQty: { gte: line.quantity },
            isActive: true,
          },
          data: {
            stockQty: { decrement: line.quantity },
          },
        });

        if (updated.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: line.productId },
            select: { name: true, stockQty: true, isActive: true },
          });
          if (!product || !product.isActive) {
            throw new ValidationError(`Produto "${line.productName}" está indisponível.`);
          }
          throw new ValidationError(
            `Estoque insuficiente para "${product.name}" (disponível: ${product.stockQty}).`,
          );
        }
      }

      return tx.sale.create({
        data: {
          saleNumber,
          paymentMethod: input.paymentMethod,
          status,
          totalCents,
          notes: input.notes,
          buyerName: input.buyerName,
          promisedPayAt: input.promisedPayAt,
          amountPaidCents: 0,
          createdById: currentUser._id,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
              lineTotalCents: line.lineTotalCents,
              sortOrder: line.sortOrder,
            })),
          },
        },
        include: saleInclude,
      });
    });

    return { sale: serializeSale(sale) };
  }

  async receivePayment(saleId: string, payload: Record<string, unknown>) {
    validateSaleId(saleId);
    const { amountCents } = validateReceivePayment(payload);

    const existing = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { id: true, status: true, totalCents: true, amountPaidCents: true },
    });

    if (!existing) {
      throw new NotFoundError("Venda não encontrada.");
    }

    if (existing.status === "CANCELADA") {
      throw new ValidationError("Não é possível receber pagamento de venda cancelada.");
    }

    if (existing.status === "REGISTRADA") {
      throw new ValidationError("Esta venda já foi paga à vista.");
    }

    const pendingBefore = existing.totalCents - existing.amountPaidCents;
    if (pendingBefore <= 0) {
      throw new ValidationError("Esta venda já está quitada.");
    }

    if (amountCents > pendingBefore) {
      throw new ValidationError(
        `Valor excede o pendente (R$ ${(pendingBefore / 100).toFixed(2).replace(".", ",")}).`,
      );
    }

    const amountPaidCents = existing.amountPaidCents + amountCents;
    const status: SaleStatus =
      amountPaidCents >= existing.totalCents ? "QUITADA" : "FIADO_PENDENTE";

    const sale = await prisma.sale.update({
      where: { id: saleId },
      data: { amountPaidCents, status },
      include: saleInclude,
    });

    return { sale: serializeSale(sale) };
  }

  async cancelSale(saleId: string, payload: Record<string, unknown>) {
    validateSaleId(saleId);
    const { cancelReason } = validateCancelSale(payload);

    const existing = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundError("Venda não encontrada.");
    }

    if (existing.status === "CANCELADA") {
      throw new ValidationError("Esta venda já está cancelada.");
    }

    if (!["REGISTRADA", "QUITADA", "FIADO_PENDENTE"].includes(existing.status)) {
      throw new ValidationError("Não é possível cancelar esta venda.");
    }

    const sale = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }

      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELADA",
          cancelReason,
          cancelledAt: new Date(),
        },
        include: saleInclude,
      });
    });

    return { sale: serializeSale(sale) };
  }

  private async resolveSaleLines(items: SaleItemInput[]): Promise<ResolvedSaleLine[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        salePriceCents: true,
        stockQty: true,
        isActive: true,
      },
    });

    const byId = new Map(products.map((product) => [product.id, product]));

    return items.map((item, index) => {
      const product = byId.get(item.productId);
      if (!product) {
        throw new NotFoundError("Produto não encontrado.");
      }
      if (!product.isActive) {
        throw new ValidationError(`Produto "${product.name}" está inativo.`);
      }

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPriceCents: product.salePriceCents,
        lineTotalCents: product.salePriceCents * item.quantity,
        sortOrder: index,
      };
    });
  }
}

export const saleService = new SaleService();
