import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";
import {
  createPatient,
  createProtocolType,
  createUser,
  loginAs, withAuth,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Protocolos de pacientes", () => {
  let adminToken: string;
  let tecnicoToken: string;
  let patientId: string;
  let protocolTypeId: string;

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

    adminToken = await loginAs(admin.email, "admin123456");
    tecnicoToken = await loginAs(tecnico.email, "tech123456");

    const patient = await createPatient({
      fullName: "João Silva",
      birthDate: new Date("2015-03-10"),
      guardianName: "Maria Silva",
      phone: "(47) 99999-1234",
      fundingSource: "MUNICIPAL",
    });
    patientId = patient._id;

    const protocolType = await createProtocolType({ name: "Solicitação de documento" });
    protocolTypeId = protocolType._id;
  });

  it("exige autenticação para listar protocolos", async () => {
    const response = await request(app).get("/api/protocols");
    expect(response.status).toBe(401);
  });

  it("nega acesso ao técnico", async () => {
    const response = await withAuth(request(app).get("/api/protocols"), tecnicoToken);
    expect(response.status).toBe(403);
  });

  it("cria protocolo com número sequencial do ano", async () => {
    const year = new Date().getFullYear();
    const response = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({
        patientId,
        protocolTypeId,
        notes: "Relatório para escola",
      });

    expect(response.status).toBe(201);
    expect(response.body.protocol.protocolNumber).toBe(year * 100_000 + 1);
    expect(response.body.protocol.protocolType._id).toBe(protocolTypeId);
    expect(response.body.protocol.protocolType.name).toBe("Solicitação de documento");
    expect(response.body.protocol.status).toBe("PENDENTE");
    expect(response.body.protocol.patient._id).toBe(patientId);
  });

  it("gera números sequenciais para múltiplos protocolos no mesmo ano", async () => {
    const year = new Date().getFullYear();
    const secondType = await createProtocolType({ name: "Troca de horário" });

    const first = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    expect(first.status).toBe(201);

    const second = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId: secondType._id });
    expect(second.status).toBe(201);
    expect(second.body.protocol.protocolNumber).toBe(year * 100_000 + 2);
  });

  it("rejeita criação com tipo inválido", async () => {
    const response = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId: randomUUID() });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/tipo de protocolo/i);
  });

  it("rejeita criação com tipo inativo", async () => {
    const inactiveType = await createProtocolType({
      name: "Tipo inativo",
      isActive: false,
    });

    const response = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId: inactiveType._id });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/inativo/i);
  });

  it("lista, atualiza status e expõe contagem pendente na listagem de pacientes", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    expect(created.status).toBe(201);
    const protocolId = created.body.protocol._id as string;

    const list = await withAuth(request(app)
      .get("/api/protocols")
      .query({ patientId, status: "PENDENTE" }), adminToken);
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: { _id: string }) => item._id === protocolId)).toBe(true);

    const byPatient = await withAuth(request(app)
      .get(`/api/patients/${patientId}/protocols`), adminToken);
    expect(byPatient.status).toBe(200);
    expect(byPatient.body.items).toHaveLength(1);

    const updated = await withAuth(request(app)
      .patch(`/api/protocols/${protocolId}/status`), adminToken)
      .send({ status: "CONCLUIDO" });
    expect(updated.status).toBe(200);
    expect(updated.body.protocol.status).toBe("CONCLUIDO");
    expect(updated.body.protocol.completedAt).toBeTruthy();

    const patients = await withAuth(request(app).get("/api/patients"), adminToken);
    expect(patients.status).toBe(200);
    const patient = patients.body.items.find((item: { _id: string }) => item._id === patientId);
    expect(patient.pendingProtocolCount).toBe(0);
  });

  it("registra data de conclusão ao concluir protocolo", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    expect(created.status).toBe(201);

    const before = Date.now();
    const updated = await withAuth(request(app)
      .patch(`/api/protocols/${created.body.protocol._id}/status`), adminToken)
      .send({ status: "CONCLUIDO" });
    const after = Date.now();

    expect(updated.status).toBe(200);
    const completedAt = new Date(updated.body.protocol.completedAt).getTime();
    expect(completedAt).toBeGreaterThanOrEqual(before);
    expect(completedAt).toBeLessThanOrEqual(after);
  });

  it("cancela protocolo com justificativa e data", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    expect(created.status).toBe(201);
    const protocolId = created.body.protocol._id as string;

    const before = Date.now();
    const updated = await withAuth(request(app)
      .patch(`/api/protocols/${protocolId}/status`), adminToken)
      .send({ status: "CANCELADO", cancelReason: "Solicitação duplicada" });
    const after = Date.now();

    expect(updated.status).toBe(200);
    expect(updated.body.protocol.status).toBe("CANCELADO");
    expect(updated.body.protocol.cancelReason).toBe("Solicitação duplicada");
    const cancelledAt = new Date(updated.body.protocol.cancelledAt).getTime();
    expect(cancelledAt).toBeGreaterThanOrEqual(before);
    expect(cancelledAt).toBeLessThanOrEqual(after);

    const patients = await withAuth(request(app).get("/api/patients"), adminToken);
    const patient = patients.body.items.find((item: { _id: string }) => item._id === patientId);
    expect(patient.pendingProtocolCount).toBe(0);
  });

  it("exige justificativa para cancelar protocolo", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });

    const response = await withAuth(request(app)
      .patch(`/api/protocols/${created.body.protocol._id}/status`), adminToken)
      .send({ status: "CANCELADO", cancelReason: "  " });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/justificativa/i);
  });

  it("impede alterar status de protocolo já concluído ou cancelado", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    const protocolId = created.body.protocol._id as string;

    await withAuth(request(app)
      .patch(`/api/protocols/${protocolId}/status`), adminToken)
      .send({ status: "CONCLUIDO" });

    const retryComplete = await withAuth(request(app)
      .patch(`/api/protocols/${protocolId}/status`), adminToken)
      .send({ status: "CONCLUIDO" });
    expect(retryComplete.status).toBe(400);

    const created2 = await withAuth(request(app)
      .post("/api/protocols"), adminToken)
      .send({ patientId, protocolTypeId });
    const protocolId2 = created2.body.protocol._id as string;

    await withAuth(request(app)
      .patch(`/api/protocols/${protocolId2}/status`), adminToken)
      .send({ status: "CANCELADO", cancelReason: "Desistência" });

    const retryCancel = await withAuth(request(app)
      .patch(`/api/protocols/${protocolId2}/status`), adminToken)
      .send({ status: "CANCELADO", cancelReason: "Outro motivo" });
    expect(retryCancel.status).toBe(400);
  });

  it("retorna 404 para protocolo inexistente", async () => {
    const response = await withAuth(
      request(app).get(`/api/protocols/${randomUUID()}`),
      adminToken,
    );

    expect(response.status).toBe(404);
  });
});

describe("Tipos de protocolo", () => {
  let adminToken: string;
  let tecnicoToken: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Tipos Protocolo",
      email: "admin@protocol-types.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const tecnico = await createUser({
      name: "Tecnico Tipos Protocolo",
      email: "tecnico@protocol-types.test",
      password: "tech123456",
      role: "TECNICO",
    });

    adminToken = await loginAs(admin.email, "admin123456");
    tecnicoToken = await loginAs(tecnico.email, "tech123456");
  });

  it("nega cadastro de tipo ao técnico", async () => {
    const response = await withAuth(request(app)
      .post("/api/protocol-types"), tecnicoToken)
      .send({ name: "Novo tipo" });

    expect(response.status).toBe(403);
  });

  it("permite ao admin criar, listar, editar e inativar tipos", async () => {
    const created = await withAuth(request(app)
      .post("/api/protocol-types"), adminToken)
      .send({ name: "Encaminhamento médico" });
    expect(created.status).toBe(201);
    expect(created.body.protocolType.name).toBe("Encaminhamento médico");

    const list = await withAuth(request(app).get("/api/protocol-types"), adminToken);
    expect(list.status).toBe(200);
    expect(list.body.items.some((item: { name: string }) => item.name === "Encaminhamento médico")).toBe(
      true,
    );

    const updated = await withAuth(request(app)
      .patch(`/api/protocol-types/${created.body.protocolType._id}`), adminToken)
      .send({ name: "Encaminhamento" });
    expect(updated.status).toBe(200);
    expect(updated.body.protocolType.name).toBe("Encaminhamento");

    const deactivated = await withAuth(request(app)
      .patch(`/api/protocol-types/${created.body.protocolType._id}/status`), adminToken)
      .send({ isActive: false });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.protocolType.isActive).toBe(false);
  });

  it("rejeita tipo com nome duplicado", async () => {
    await createProtocolType({ name: "Segunda via" });

    const response = await withAuth(request(app)
      .post("/api/protocol-types"), adminToken)
      .send({ name: "Segunda via" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/já existe/i);
  });
});
