import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";
import { createPatient, createUser, loginAndGetCookie } from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Protocolos de pacientes", () => {
  let adminCookie: string;
  let tecnicoCookie: string;
  let patientId: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Protocolos",
      email: "admin@protocols.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const tecnico = await createUser({
      name: "Tecnico Protocolos",
      email: "tecnico@protocols.test",
      password: "tech123456",
      role: "TECNICO",
    });

    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
    tecnicoCookie = await loginAndGetCookie(tecnico.email, "tech123456");

    const patient = await createPatient({
      fullName: "João Silva",
      birthDate: new Date("2015-03-10"),
      guardianName: "Maria Silva",
      phone: "(47) 99999-1234",
      fundingSource: "MUNICIPAL",
    });
    patientId = patient._id;
  });

  it("exige autenticação para listar protocolos", async () => {
    const response = await request(app).get("/api/protocols");
    expect(response.status).toBe(401);
  });

  it("nega acesso ao técnico", async () => {
    const response = await request(app).get("/api/protocols").set("Cookie", tecnicoCookie);
    expect(response.status).toBe(403);
  });

  it("cria protocolo com número sequencial do ano", async () => {
    const year = new Date().getFullYear();
    const response = await request(app)
      .post("/api/protocols")
      .set("Cookie", adminCookie)
      .send({
        patientId,
        requestType: "DOCUMENTO",
        notes: "Relatório para escola",
      });

    expect(response.status).toBe(201);
    expect(response.body.protocol.protocolNumber).toBe(year * 100_000 + 1);
    expect(response.body.protocol.requestType).toBe("DOCUMENTO");
    expect(response.body.protocol.status).toBe("PENDENTE");
    expect(response.body.protocol.patient._id).toBe(patientId);
  });

  it("gera números sequenciais para múltiplos protocolos no mesmo ano", async () => {
    const year = new Date().getFullYear();

    const first = await request(app)
      .post("/api/protocols")
      .set("Cookie", adminCookie)
      .send({ patientId, requestType: "DOCUMENTO" });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/protocols")
      .set("Cookie", adminCookie)
      .send({ patientId, requestType: "TROCA_HORARIO" });
    expect(second.status).toBe(201);
    expect(second.body.protocol.protocolNumber).toBe(year * 100_000 + 2);
  });

  it("rejeita criação com tipo inválido", async () => {
    const response = await request(app)
      .post("/api/protocols")
      .set("Cookie", adminCookie)
      .send({ patientId, requestType: "invalido" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/tipo de solicitação/i);
  });

  it("lista, atualiza status e expõe contagem pendente na listagem de pacientes", async () => {
    const created = await request(app)
      .post("/api/protocols")
      .set("Cookie", adminCookie)
      .send({ patientId, requestType: "DOCUMENTO" });
    expect(created.status).toBe(201);
    const protocolId = created.body.protocol._id as string;

    const list = await request(app)
      .get("/api/protocols")
      .query({ patientId, status: "PENDENTE" })
      .set("Cookie", adminCookie);
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: { _id: string }) => item._id === protocolId)).toBe(true);

    const byPatient = await request(app)
      .get(`/api/patients/${patientId}/protocols`)
      .set("Cookie", adminCookie);
    expect(byPatient.status).toBe(200);
    expect(byPatient.body.items).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/protocols/${protocolId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "CONCLUIDO" });
    expect(updated.status).toBe(200);
    expect(updated.body.protocol.status).toBe("CONCLUIDO");

    const patients = await request(app).get("/api/patients").set("Cookie", adminCookie);
    expect(patients.status).toBe(200);
    const patient = patients.body.items.find((item: { _id: string }) => item._id === patientId);
    expect(patient.pendingProtocolCount).toBe(0);
  });

  it("retorna 404 para protocolo inexistente", async () => {
    const response = await request(app)
      .get(`/api/protocols/${randomUUID()}`)
      .set("Cookie", adminCookie);

    expect(response.status).toBe(404);
  });
});
