import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { isPrismaUniqueViolation } from "../db/errors.js";
import { serializePopulatedNameRef, withMongoId, withMongoIdList } from "../db/serialize.js";
import { ConflictError, NotFoundError } from "../errors/http-errors.js";
import { containsInsensitive, isUuid } from "../validators/agenda/agenda.utils.js";
import {
  validateCategoryId,
  validateCreateProduct,
  validateCreateProductCategory,
  validateIsActive,
  validateProductId,
  validateUpdateProduct,
  validateUpdateProductCategory,
} from "../validators/sales/product.validator.js";

const productInclude = {
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

function serializeProduct(record: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
  const { id, category, ...rest } = record;
  return {
    ...rest,
    _id: id,
    category: serializePopulatedNameRef(category),
  };
}

export class ProductService {
  async listCategories(includeInactive = false) {
    const items = await prisma.productCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" },
    });
    return { items: withMongoIdList(items) };
  }

  async createCategory(payload: { name?: unknown }) {
    const { name } = validateCreateProductCategory(payload);

    try {
      const category = await prisma.productCategory.create({ data: { name } });
      return { category: withMongoId(category) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe uma categoria com este nome.");
      }
      throw error;
    }
  }

  async updateCategory(categoryId: string, payload: { name?: unknown }) {
    const updates = validateUpdateProductCategory(categoryId, payload);
    await this.findCategoryOrThrow(categoryId);

    if (!updates.name) {
      const category = await prisma.productCategory.findUniqueOrThrow({ where: { id: categoryId } });
      return { category: withMongoId(category) };
    }

    try {
      const category = await prisma.productCategory.update({
        where: { id: categoryId },
        data: { name: updates.name },
      });
      return { category: withMongoId(category) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe uma categoria com este nome.");
      }
      throw error;
    }
  }

  async updateCategoryStatus(categoryId: string, isActive: boolean) {
    validateCategoryId(categoryId);
    validateIsActive(isActive);

    try {
      const category = await prisma.productCategory.update({
        where: { id: categoryId },
        data: { isActive },
      });
      return { category: withMongoId(category) };
    } catch {
      throw new NotFoundError("Categoria não encontrada.");
    }
  }

  async listProducts(query: Record<string, unknown> = {}) {
    const search = String(query.search ?? "").trim();
    const activeOnly = query.activeOnly !== "false" && query.activeOnly !== false;
    const inStockOnly = query.inStockOnly === "true" || query.inStockOnly === true;

    const where: Prisma.ProductWhereInput = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(inStockOnly ? { stockQty: { gt: 0 } } : {}),
      ...(search
        ? {
            OR: [
              { name: containsInsensitive(search) },
              { category: { name: containsInsensitive(search) } },
            ],
          }
        : {}),
    };

    const items = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return { items: items.map(serializeProduct) };
  }

  async createProduct(payload: Record<string, unknown>) {
    const input = validateCreateProduct(payload);
    await this.findActiveCategoryOrThrow(input.categoryId);

    const product = await prisma.product.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
        salePriceCents: input.salePriceCents,
        costCents: input.costCents,
        stockQty: input.stockQty,
        minStockQty: input.minStockQty,
      },
      include: productInclude,
    });

    return { product: serializeProduct(product) };
  }

  async updateProduct(productId: string, payload: Record<string, unknown>) {
    const updates = validateUpdateProduct(productId, payload);
    await this.findProductOrThrow(productId);

    if (updates.categoryId) {
      await this.findActiveCategoryOrThrow(updates.categoryId);
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updates,
      include: productInclude,
    });

    return { product: serializeProduct(product) };
  }

  async updateProductStatus(productId: string, isActive: boolean) {
    validateProductId(productId);
    validateIsActive(isActive);

    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isActive },
        include: productInclude,
      });
      return { product: serializeProduct(product) };
    } catch {
      throw new NotFoundError("Produto não encontrado.");
    }
  }

  private async findCategoryOrThrow(categoryId: string) {
    validateCategoryId(categoryId);
    const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundError("Categoria não encontrada.");
    }
    return category;
  }

  private async findActiveCategoryOrThrow(categoryId: string) {
    const category = await this.findCategoryOrThrow(categoryId);
    if (!category.isActive) {
      throw new ConflictError("A categoria selecionada está inativa.");
    }
    return category;
  }

  private async findProductOrThrow(productId: string) {
    if (!isUuid(productId)) {
      throw new NotFoundError("Produto não encontrado.");
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }
    return product;
  }
}

export const productService = new ProductService();
