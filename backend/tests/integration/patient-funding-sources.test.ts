import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { createUser, loginAs, withAuth, seedPatientFundingSources } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Fontes de custeio de pacientes", () => {
  let adminToken: string;
  let tecnicoToken: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Custeio",
      email: "admin@funding-sources.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const tecnico = await createUser({
      name: "Técnico Custeio",
      email: "tecnico@funding-sources.test",
      password: "tech123456",
      role: "TECNICO",
    });

    adminToken = await loginAs(admin.email, "admin123456");
    tecnicoToken = await loginAs(tecnico.email, "tech123456");
    await seedPatientFundingSources();
  });

  it("exige autenticação para listar fontes de custeio", async () => {
    const response = await request(app).get("/api/funding-sources");
    expect(response.status).toBe(401);
  });

  it("permite listar fontes de custeio para usuário autenticado", async () => {
    const response = await withAuth(request(app).get("/api/funding-sources"), tecnicoToken);
    expect(response.status).toBe(200);
    expect(response.body.items.length).toBeGreaterThanOrEqual(3);
  });

  it("cria, edita e inativa fonte de custeio como administrador", async () => {
    const created = await withAuth(request(app)
      .post("/api/funding-sources"), adminToken)
      .send({ name: "Convênio" });

    expect(created.status).toBe(201);
    expect(created.body.fundingSource.name).toBe("Convênio");
    expect(created.body.fundingSource.isActive).toBe(true);

    const updated = await withAuth(request(app)
      .patch(`/api/funding-sources/${created.body.fundingSource._id}`), adminToken)
      .send({ name: "Convênio especial" });

    expect(updated.status).toBe(200);
    expect(updated.body.fundingSource.name).toBe("Convênio especial");

    const inactivated = await withAuth(request(app)
      .patch(`/api/funding-sources/${created.body.fundingSource._id}/status`), adminToken)
      .send({ isActive: false });

    expect(inactivated.status).toBe(200);
    expect(inactivated.body.fundingSource.isActive).toBe(false);
  });

  it("rejeita criação duplicada", async () => {
    const response = await withAuth(request(app)
      .post("/api/funding-sources"), adminToken)
      .send({ name: "Municipal" });

    expect(response.status).toBe(409);
  });

  it("bloqueia mutações para técnico", async () => {
    const response = await withAuth(request(app)
      .post("/api/funding-sources"), tecnicoToken)
      .send({ name: "Nova fonte" });

    expect(response.status).toBe(403);
  });
});
