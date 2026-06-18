import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import {
  buildSessionPayload,
  createPatient,
  createProtocolType,
  createUser,
  loginAndGetCookie,
  seedAgendaBase,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Autorização por perfil", () => {
  let adminCookie: string;
  let tecnicoCookie: string;
  let recepcaoCookie: string;
  let operadorCookie: string;

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

    adminCookie = await loginAndGetCookie(admin.email, "admin123456");
    tecnicoCookie = await loginAndGetCookie(tecnico.email, "tech123456");
    recepcaoCookie = await loginAndGetCookie(recepcao.email, "recep123456");
    operadorCookie = await loginAndGetCookie(operador.email, "oper123456");
  });

  describe("funcionários (/users)", () => {
    it("exige autenticação", async () => {
      const response = await request(app).get("/api/users");
      expect(response.status).toBe(401);
    });

    it("nega acesso ao técnico", async () => {
      const response = await request(app).get("/api/users").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });

    it("nega acesso à recepção", async () => {
      const response = await request(app).get("/api/users").set("Cookie", recepcaoCookie);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });

    it("permite listagem ao administrador", async () => {
      const response = await request(app).get("/api/users").set("Cookie", adminCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("pacientes (/patients)", () => {
    it("permite listagem ao técnico autenticado", async () => {
      const response = await request(app).get("/api/patients").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("nega listagem à recepção", async () => {
      const response = await request(app).get("/api/patients").set("Cookie", recepcaoCookie);
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/negado/i);
    });
  });

  describe("protocolos (/protocols)", () => {
    it("nega listagem ao técnico", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", tecnicoCookie);
      expect(response.status).toBe(403);
    });

    it("permite listagem ao administrador", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", adminCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("permite listagem à recepção", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", recepcaoCookie);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("nega cadastro de tipo de protocolo à recepção", async () => {
      const response = await request(app)
        .post("/api/protocol-types")
        .set("Cookie", recepcaoCookie)
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

      const createResponse = await request(app)
        .post("/api/protocols")
        .set("Cookie", recepcaoCookie)
        .send({
          patientId: patient._id,
          protocolTypeId: protocolType._id,
          notes: "Solicitação na recepção",
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.protocol.status).toBe("PENDENTE");

      const protocolId = createResponse.body.protocol._id as string;

      const completeResponse = await request(app)
        .patch(`/api/protocols/${protocolId}/status`)
        .set("Cookie", recepcaoCookie)
        .send({ status: "CONCLUIDO" });

      expect(completeResponse.status).toBe(403);
    });
  });

  describe("agenda — cadastro de salas", () => {
    it("nega criação de sala ao técnico", async () => {
      const response = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", tecnicoCookie)
        .send({ name: "Sala Bloqueada" });

      expect(response.status).toBe(403);
    });

    it("nega criação de sala à recepção", async () => {
      const response = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", recepcaoCookie)
        .send({ name: "Sala Bloqueada Recepção" });

      expect(response.status).toBe(403);
    });

    it("permite criação de sala ao administrador", async () => {
      const response = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "Sala Permitida" });

      expect(response.status).toBe(201);
      expect(response.body.room.name).toBe("Sala Permitida");
    });
  });

  describe("agenda — recepção", () => {
    it("lista sessões de outros profissionais e bloqueia conclusão e evoluções", async () => {
      const { adminCookie: seededAdminCookie, profissional, paciente, room, sessionType } =
        await seedAgendaBase();

      const createResponse = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", seededAdminCookie)
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

      const listResponse = await request(app)
        .get("/api/agenda/sessions")
        .query({ startAt: "2026-06-10T00:00:00.000Z", endAt: "2026-06-10T23:59:59.999Z" })
        .set("Cookie", recepcaoCookie);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.items.some((item: { _id: string }) => item._id === sessionId)).toBe(
        true,
      );

      const completeResponse = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`)
        .set("Cookie", recepcaoCookie);

      expect(completeResponse.status).toBe(403);

      const evolutionsResponse = await request(app)
        .get(`/api/agenda/sessions/${sessionId}/evolutions`)
        .set("Cookie", recepcaoCookie);

      expect(evolutionsResponse.status).toBe(403);

      const patientEvolutionsResponse = await request(app)
        .get(`/api/patients/${paciente._id}/evolutions`)
        .set("Cookie", recepcaoCookie);

      expect(patientEvolutionsResponse.status).toBe(403);
    });
  });

  describe("vendas (/sales)", () => {
    it("nega listagem ao técnico e à recepção", async () => {
      const tecnicoResponse = await request(app)
        .get("/api/sales/products")
        .set("Cookie", tecnicoCookie);
      expect(tecnicoResponse.status).toBe(403);

      const recepcaoResponse = await request(app)
        .get("/api/sales/products")
        .set("Cookie", recepcaoCookie);
      expect(recepcaoResponse.status).toBe(403);
    });

    it("permite listagem ao operador e ao administrador", async () => {
      const operadorResponse = await request(app)
        .get("/api/sales/products")
        .set("Cookie", operadorCookie);
      expect(operadorResponse.status).toBe(200);

      const adminResponse = await request(app)
        .get("/api/sales/products")
        .set("Cookie", adminCookie);
      expect(adminResponse.status).toBe(200);
    });

    it("nega pacientes ao operador", async () => {
      const response = await request(app).get("/api/patients").set("Cookie", operadorCookie);
      expect(response.status).toBe(403);
    });

    it("nega protocolos ao operador", async () => {
      const response = await request(app).get("/api/protocols").set("Cookie", operadorCookie);
      expect(response.status).toBe(403);
    });
  });
});
