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

describe("Vendas", () => {
  let adminCookie: string;
  let operadorCookie: string;
  let productId: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Sales",
      email: "admin-sales@authz.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const operador = await createUser({
      name: "Operador Sales",
      email: "operador-sales@authz.test",
      password: "oper123456",
      role: "OPERADOR",
    });

    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
    operadorCookie = await loginAndGetCookie(operador.email, "oper123456");

    const category = await createProductCategory("Bebidas");
    const product = await createProduct({
      name: "Refrigerante",
      categoryId: category._id,
      salePriceCents: 500,
      stockQty: 10,
    });
    productId = product._id;
  });

  it("operador finaliza venda e baixa estoque", async () => {
    const response = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "PIX",
        items: [{ productId, quantity: 2 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.sale.status).toBe("REGISTRADA");
    expect(response.body.sale.totalCents).toBe(1000);
    expect(response.body.sale.saleNumber).toBeGreaterThan(0);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQty).toBe(8);
  });

  it("rejeita venda com estoque insuficiente", async () => {
    const response = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "DINHEIRO",
        items: [{ productId, quantity: 99 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/estoque insuficiente/i);
  });

  it("admin cancela venda e restaura estoque", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "DEBITO",
        items: [{ productId, quantity: 1 }],
      });

    const saleId = createResponse.body.sale._id as string;

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleId}/cancel`)
      .set("Cookie", adminCookie)
      .send({ cancelReason: "Erro no registro" });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.sale.status).toBe("CANCELADA");

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stockQty).toBe(10);
  });

  it("cria venda fiada e recebe pagamento parcial e total", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "FIADO",
        buyerName: "João Silva",
        promisedPayAt: "2026-07-01",
        items: [{ productId, quantity: 2 }],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.sale.status).toBe("FIADO_PENDENTE");
    expect(createResponse.body.sale.totalCents).toBe(1000);

    const saleId = createResponse.body.sale._id as string;

    const partialResponse = await request(app)
      .post(`/api/sales/${saleId}/payments`)
      .set("Cookie", operadorCookie)
      .send({ amountCents: 400 });

    expect(partialResponse.status).toBe(200);
    expect(partialResponse.body.sale.status).toBe("FIADO_PENDENTE");
    expect(partialResponse.body.sale.amountPaidCents).toBe(400);

    const fullResponse = await request(app)
      .post(`/api/sales/${saleId}/payments`)
      .set("Cookie", operadorCookie)
      .send({ amountCents: 600 });

    expect(fullResponse.status).toBe(200);
    expect(fullResponse.body.sale.status).toBe("QUITADA");
    expect(fullResponse.body.sale.amountPaidCents).toBe(1000);

    const fiadosResponse = await request(app)
      .get("/api/sales/fiados")
      .set("Cookie", operadorCookie);

    expect(fiadosResponse.status).toBe(200);
    expect(fiadosResponse.body.items).toHaveLength(0);
  });

  it("operador não cancela venda", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "PIX",
        items: [{ productId, quantity: 1 }],
      });

    const saleId = createResponse.body.sale._id as string;

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleId}/cancel`)
      .set("Cookie", operadorCookie)
      .send({ cancelReason: "Tentativa" });

    expect(cancelResponse.status).toBe(403);
  });

  it("retorna detalhe da venda com itens", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "PIX",
        items: [{ productId, quantity: 2 }],
      });

    const saleId = createResponse.body.sale._id as string;

    const detailResponse = await request(app)
      .get(`/api/sales/${saleId}`)
      .set("Cookie", operadorCookie);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.sale._id).toBe(saleId);
    expect(detailResponse.body.sale.items).toHaveLength(1);
    expect(detailResponse.body.sale.items[0].quantity).toBe(2);
    expect(detailResponse.body.sale.items[0].product.name).toBe("Refrigerante");
  });

  it("retorna 404 para venda inexistente", async () => {
    const response = await request(app)
      .get("/api/sales/00000000-0000-4000-8000-000000000000")
      .set("Cookie", operadorCookie);

    expect(response.status).toBe(404);
  });

  it("rejeita cancelamento sem justificativa", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "PIX",
        items: [{ productId, quantity: 1 }],
      });

    const saleId = createResponse.body.sale._id as string;

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleId}/cancel`)
      .set("Cookie", adminCookie)
      .send({ cancelReason: "   " });

    expect(cancelResponse.status).toBe(400);
    expect(cancelResponse.body.message).toMatch(/justificativa/i);
  });

  it("admin cancela venda fiada pendente e restaura estoque", async () => {
    const createResponse = await request(app)
      .post("/api/sales")
      .set("Cookie", operadorCookie)
      .send({
        paymentMethod: "FIADO",
        buyerName: "Maria",
        promisedPayAt: "2026-08-01",
        items: [{ productId, quantity: 3 }],
      });

    const saleId = createResponse.body.sale._id as string;

    const productBefore = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(productBefore.stockQty).toBe(7);

    const cancelResponse = await request(app)
      .patch(`/api/sales/${saleId}/cancel`)
      .set("Cookie", adminCookie)
      .send({ cancelReason: "Cliente desistiu" });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.sale.status).toBe("CANCELADA");

    const productAfter = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(productAfter.stockQty).toBe(10);
  });
});
