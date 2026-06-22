import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import {
  buildSessionPayload,
  createPatient,
  createProtocolType,
  createUser,
  loginAs, withAuth,
  seedAgendaBase,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Autorização por perfil", () => {
  let adminToken: string;
  let tecnicoToken: string;
  let recepcaoToken: string;
  let operadorToken: string;

  useIntegrationTestDatabase();

  beforeEach(async () => {
    const admin = await createUser({
      name: "Admin Authz",
      email: "admin@authz.test",
      password: "admin123456",
      role: "ADMINISTRADOR",
    });
    const tecnico = await createUser({
      name: "Tecnico Authz",
      email: "tecnico@authz.test",
      password: "tech123456",
      role: "TECNICO",
    });
    const recepcao = await createUser({
      name: "Recepcao Authz",
      email: "recepcao@authz.test",
      password: "recep123456",
      role: "RECEPCAO",
    });
    const operador = await createUser({
      name: "Operador Authz",
      email: "operador@authz.test",
      password: "oper123456",
      role: "OPERADOR",
    });

    adminToken = await loginAs(admin.email, "admin123456");
    tecnicoToken = await loginAs(tecnico.email, "tech123456");
    recepcaoToken = await loginAs(recepcao.email, "recep123456");
    operadorToken = await loginAs(operador.email, "oper123456");
  });

  describe("funcionários (/users)", () => {
    it("exige autenticação", async () => {
      const response = await request(app).get("/api/users");
      expect(response.status).toBe(401);
    });

    it("nega acesso ao técnico", async () => {
      const response = await withAuth(request(app).get("/api/users"), tecnicoToken);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });

    it("nega acesso à recepção", async () => {
      const response = await withAuth(request(app).get("/api/users"), recepcaoToken);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });

    it("permite listagem ao administrador", async () => {
      const response = await withAuth(request(app).get("/api/users"), adminToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("pacientes (/patients)", () => {
    it("permite listagem ao técnico autenticado", async () => {
      const response = await withAuth(request(app).get("/api/patients"), tecnicoToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("nega listagem à recepção", async () => {
      const response = await withAuth(request(app).get("/api/patients"), recepcaoToken);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });
  });

  describe("protocolos (/protocols)", () => {
    it("nega listagem ao técnico", async () => {
      const response = await withAuth(request(app).get("/api/protocols"), tecnicoToken);
      expect(response.status).toBe(403);
    });

    it("permite listagem ao administrador", async () => {
      const response = await withAuth(request(app).get("/api/protocols"), adminToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("permite listagem à recepção", async () => {
      const response = await withAuth(request(app).get("/api/protocols"), recepcaoToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("nega cadastro de tipo de protocolo à recepção", async () => {
      const response = await withAuth(request(app)
        .post("/api/protocol-types"), recepcaoToken)
        .send({ name: "Tipo Bloqueado" });

      expect(response.status).toBe(403);
    });

    it("permite abrir protocolo à recepção e nega conclusão", async () => {
      const patient = await createPatient({
        fullName: "Paciente Recepção",
        birthDate: new Date("2015-01-01"),
        guardianName: "Responsável",
        phone: "(47) 99999-0000",
      });
      const protocolType = await createProtocolType({ name: "Documento escolar" });

      const createResponse = await withAuth(request(app)
        .post("/api/protocols"), recepcaoToken)
        .send({
          patientId: patient._id,
          protocolTypeId: protocolType._id,
          notes: "Solicitação na recepção",
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.protocol.status).toBe("PENDENTE");

      const protocolId = createResponse.body.protocol._id as string;

      const completeResponse = await withAuth(request(app)
        .patch(`/api/protocols/${protocolId}/status`), recepcaoToken)
        .send({ status: "CONCLUIDO" });

      expect(completeResponse.status).toBe(403);
    });
  });

  describe("agenda — cadastro de salas", () => {
    it("nega criação de sala ao técnico", async () => {
      const response = await withAuth(request(app)
        .post("/api/agenda/rooms"), tecnicoToken)
        .send({ name: "Sala Bloqueada" });

      expect(response.status).toBe(403);
    });

    it("nega criação de sala à recepção", async () => {
      const response = await withAuth(request(app)
        .post("/api/agenda/rooms"), recepcaoToken)
        .send({ name: "Sala Bloqueada Recepção" });

      expect(response.status).toBe(403);
    });

    it("permite criação de sala ao administrador", async () => {
      const response = await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "Sala Permitida" });

      expect(response.status).toBe(201);
      expect(response.body.room.name).toBe("Sala Permitida");
    });
  });

  describe("agenda — recepção", () => {
    it("lista sessões de outros profissionais e bloqueia conclusão e evoluções", async () => {
      const { adminToken: seededAdminToken, profissional, paciente, room, sessionType } =
        await seedAgendaBase();

      const createResponse = await withAuth(request(app)
        .post("/api/agenda/sessions"), seededAdminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-10T14:00:00.000Z",
          }),
        );

      expect(createResponse.status).toBe(201);
      const sessionId = createResponse.body.session._id as string;

      const listResponse = await withAuth(request(app)
        .get("/api/agenda/sessions")
        .query({ startAt: "2026-06-10T00:00:00.000Z", endAt: "2026-06-10T23:59:59.999Z" }), recepcaoToken);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.items.some((item: { _id: string }) => item._id === sessionId)).toBe(
        true,
      );

      const completeResponse = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`), recepcaoToken);

      expect(completeResponse.status).toBe(403);

      const evolutionsResponse = await withAuth(request(app)
        .get(`/api/agenda/sessions/${sessionId}/evolutions`), recepcaoToken);

      expect(evolutionsResponse.status).toBe(403);

      const patientEvolutionsResponse = await withAuth(request(app)
        .get(`/api/patients/${paciente._id}/evolutions`), recepcaoToken);

      expect(patientEvolutionsResponse.status).toBe(403);
    });
  });

  describe("vendas (/sales)", () => {
    it("nega listagem ao técnico e à recepção", async () => {
      const tecnicoResponse = await withAuth(request(app).get("/api/sales/products"), tecnicoToken);
      expect(tecnicoResponse.status).toBe(403);

      const recepcaoResponse = await withAuth(request(app).get("/api/sales/products"), recepcaoToken);
      expect(recepcaoResponse.status).toBe(403);
    });

    it("permite listagem ao operador e ao administrador", async () => {
      const operadorResponse = await withAuth(request(app).get("/api/sales/products"), operadorToken);
      expect(operadorResponse.status).toBe(200);

      const adminResponse = await withAuth(request(app).get("/api/sales/products"), adminToken);
      expect(adminResponse.status).toBe(200);
    });

    it("nega pacientes ao operador", async () => {
      const response = await withAuth(request(app).get("/api/patients"), operadorToken);
      expect(response.status).toBe(403);
    });

    it("nega protocolos ao operador", async () => {
      const response = await withAuth(request(app).get("/api/protocols"), operadorToken);
      expect(response.status).toBe(403);
    });
  });
});
