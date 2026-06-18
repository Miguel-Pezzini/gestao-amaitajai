import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import {
  createProduct,
  createProductCategory,
  createUser,
  loginAndGetCookie,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Produtos de vendas", () => {
  let adminCookie: string;
  let operadorCookie: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Vendas",
      email: "admin-vendas@authz.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const operador = await createUser({
      name: "Operador Vendas",
      email: "operador-vendas@authz.test",
      password: "oper123456",
      role: "OPERADOR",
    });

    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
    operadorCookie = await loginAndGetCookie(operador.email, "oper123456");
  });

  it("admin cria categoria e produto", async () => {
    const categoryResponse = await request(app)
      .post("/api/sales/categories")
      .set("Cookie", adminCookie)
      .send({ name: "Bebidas" });

    expect(categoryResponse.status).toBe(201);
    const categoryId = categoryResponse.body.category._id as string;

    const productResponse = await request(app)
      .post("/api/sales/products")
      .set("Cookie", adminCookie)
      .send({
        name: "Água",
        categoryId,
        salePriceCents: 300,
        stockQty: 20,
      });

    expect(productResponse.status).toBe(201);
    expect(productResponse.body.product.name).toBe("Água");
    expect(productResponse.body.product.salePriceCents).toBe(300);
  });

  it("operador lista produtos mas não cria", async () => {
    const category = await createProductCategory("Alimentos");
    await createProduct({
      name: "Salgadinho",
      categoryId: category._id,
      salePriceCents: 500,
    });

    const listResponse = await request(app)
      .get("/api/sales/products")
      .set("Cookie", operadorCookie);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThanOrEqual(1);

    const createResponse = await request(app)
      .post("/api/sales/products")
      .set("Cookie", operadorCookie)
      .send({
        name: "Bloqueado",
        categoryId: category._id,
        salePriceCents: 100,
      });

    expect(createResponse.status).toBe(403);
  });
});
