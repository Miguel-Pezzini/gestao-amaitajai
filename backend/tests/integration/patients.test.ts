import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";
import { createUser, loginAndGetCookie } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

const validPatientPayload = {
  fullName: "João da Silva",
  birthDate: "2015-03-10",
  guardianName: "Maria da Silva",
  phone: "(47) 99999-1234",
  fundingSource: "Municipal",
};

describe("Pacientes", () => {
  let adminCookie: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Pacientes",
      email: "admin@patients.test",
      password: "admin123456",
      role: "administrador",
    });
    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
  });

  it("exige autenticação para listar pacientes", async () => {
    const response = await request(app).get("/api/patients");
    expect(response.status).toBe(401);
  });

  it("cria paciente com payload válido", async () => {
    const response = await request(app)
      .post("/api/patients")
      .set("Cookie", adminCookie)
      .send(validPatientPayload);

    expect(response.status).toBe(201);
    expect(response.body.patient.fullName).toBe(validPatientPayload.fullName);
    expect(response.body.patient.fundingSource).toBe("Municipal");
    expect(response.body.patient.isActive).toBe(true);
  });

  it("rejeita criação com telefone inválido", async () => {
    const response = await request(app)
      .post("/api/patients")
      .set("Cookie", adminCookie)
      .send({ ...validPatientPayload, phone: "123" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/telefone/i);
  });

  it("lista, busca, atualiza e inativa paciente", async () => {
    const created = await request(app)
      .post("/api/patients")
      .set("Cookie", adminCookie)
      .send(validPatientPayload);
    expect(created.status).toBe(201);
    const patientId = created.body.patient._id as string;

    const list = await request(app)
      .get("/api/patients")
      .query({ search: "João" })
      .set("Cookie", adminCookie);
    expect(list.status).toBe(200);
    expect(list.body.items.some((p: { _id: string }) => p._id === patientId)).toBe(true);

    const detail = await request(app)
      .get(`/api/patients/${patientId}`)
      .set("Cookie", adminCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.patient._id).toBe(patientId);

    const updated = await request(app)
      .patch(`/api/patients/${patientId}`)
      .set("Cookie", adminCookie)
      .send({ guardianName: "Maria Santos" });
    expect(updated.status).toBe(200);
    expect(updated.body.patient.guardianName).toBe("Maria Santos");

    const deactivated = await request(app)
      .patch(`/api/patients/${patientId}/status`)
      .set("Cookie", adminCookie)
      .send({ isActive: false });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.patient.isActive).toBe(false);

    const inactiveList = await request(app)
      .get("/api/patients")
      .query({ status: "inactive" })
      .set("Cookie", adminCookie);
    expect(
      inactiveList.body.items.some((p: { _id: string }) => p._id === patientId),
    ).toBe(true);
  });

  it("retorna 404 para paciente inexistente", async () => {
    const response = await request(app)
      .get(`/api/patients/${randomUUID()}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
