import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { randomUUID } from "node:crypto";
import {
  buildRecurringSessionPayload,
  buildSessionPayload,
  createPatient,
  createRoom,
  createSessionType,
  createUser,
  loginAs, withAuth,
  seedAgendaBase,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

describe("Agenda integration", () => {
  useIntegrationTestDatabase();

  describe("autenticação e autorização", () => {
    it("bloqueia criação de sala para técnico e permite para administrador", async () => {
      const adminPassword = "admin123456";
      const techPassword = "tech123456";
      const admin = await createUser({
        name: "Admin",
        email: "admin@amaitajai.org.br",
        password: adminPassword,
        role: "ADMINISTRADOR",
      });
      const tecnico = await createUser({
        name: "Tecnico",
        email: "tecnico@amaitajai.org.br",
        password: techPassword,
        role: "TECNICO",
      });

      expect(admin.role).toBe("ADMINISTRADOR");
      expect(tecnico.role).toBe("TECNICO");

      const adminToken = await loginAs(admin.email, adminPassword);
      const tecnicoToken = await loginAs(tecnico.email, techPassword);

      const forbidden = await withAuth(request(app)
        .post("/api/agenda/rooms"), tecnicoToken)
        .send({ name: "Sala T1" });
      expect(forbidden.status).toBe(403);

      const created = await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "Sala A1" });
      expect(created.status).toBe(201);
      expect(created.body.room.name).toBe("Sala A1");
    });

    it("exige autenticação para listar sessões", async () => {
      const response = await request(app).get("/api/agenda/sessions");
      expect(response.status).toBe(401);
    });
  });

  describe("salas", () => {
    it("rejeita sala sem nome e duplicata de nome", async () => {
      const { adminToken } = await seedAgendaBase();
      const empty = await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "   " });
      expect(empty.status).toBe(400);
      expect(empty.body.code).toBe("ValidationError");

      await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "Sala Única" });

      const duplicate = await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "Sala Única" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.code).toBe("ConflictError");
    });

    it("lista, atualiza e altera status da sala", async () => {
      const { adminToken } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/rooms"), adminToken)
        .send({ name: "Sala Editável" });
      const roomId = created.body.room._id as string;

      const list = await withAuth(request(app).get("/api/agenda/rooms"), adminToken);
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBeGreaterThanOrEqual(2);

      const updated = await withAuth(request(app)
        .patch(`/api/agenda/rooms/${roomId}`), adminToken)
        .send({ name: "Sala Renomeada" });
      expect(updated.status).toBe(200);
      expect(updated.body.room.name).toBe("Sala Renomeada");

      const deactivated = await withAuth(request(app)
        .patch(`/api/agenda/rooms/${roomId}/status`), adminToken)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.room.isActive).toBe(false);
    });

    it("rejeita isActive inválido no status da sala", async () => {
      const { adminToken, room } = await seedAgendaBase();

      const response = await withAuth(request(app)
        .patch(`/api/agenda/rooms/${room._id}/status`), adminToken)
        .send({ isActive: "sim" });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("booleano");
    });
  });

  describe("tipos de sessão", () => {
    it("cria tipo de sessão e rejeita dados inválidos", async () => {
      const { adminToken } = await seedAgendaBase();

      const invalid = await withAuth(request(app)
        .post("/api/agenda/session-types"), adminToken)
        .send({ name: "", defaultDurationMinutes: 0, allowedModalities: [] });
      expect(invalid.status).toBe(400);

      const created = await withAuth(request(app)
        .post("/api/agenda/session-types"), adminToken)
        .send({
          name: "FONOAUDIOLOGIA",
          defaultDurationMinutes: 45,
          isDurationFlexible: true,
          allowedModalities: ["INDIVIDUAL", "GRUPO"],
        });
      expect(created.status).toBe(201);
      expect(created.body.sessionType.allowedModalities).toContain("GRUPO");
    });

    it("rejeita tea-14-plus com modalidade diferente de grupo", async () => {
      const { adminToken } = await seedAgendaBase();

      const response = await withAuth(request(app)
        .post("/api/agenda/session-types"), adminToken)
        .send({
          name: "TEA 14 Plus",
          defaultDurationMinutes: 60,
          allowedModalities: ["INDIVIDUAL"],
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("tea-14-plus");
    });

    it("lista e atualiza tipo de sessão", async () => {
      const { adminToken, sessionType } = await seedAgendaBase();

      const list = await withAuth(request(app)
        .get("/api/agenda/session-types"), adminToken);
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBeGreaterThanOrEqual(1);

      const updated = await withAuth(request(app)
        .patch(`/api/agenda/session-types/${sessionType._id}`), adminToken)
        .send({ defaultDurationMinutes: 50 });
      expect(updated.status).toBe(200);
      expect(updated.body.sessionType.defaultDurationMinutes).toBe(50);
    });
  });

  describe("tipos de sessão (cadastros gerais)", () => {
    it("lista e atualiza limites por tipo de sessão", async () => {
      const { adminToken } = await seedAgendaBase();

      const list = await withAuth(request(app).get("/api/agenda/session-modalities"), adminToken);
      expect(list.status).toBe(200);
      expect(list.body.items).toHaveLength(3);
      expect(list.body.items.some((item: { modality: string }) => item.modality === "GRUPO")).toBe(true);

      const updated = await withAuth(request(app)
        .patch("/api/agenda/session-modalities/GRUPO"), adminToken)
        .send({
          minPatients: 1,
          maxPatients: 2,
          minProfessionals: 1,
          maxProfessionals: 2,
          isActive: true,
        });
      expect(updated.status).toBe(200);
      expect(updated.body.setting.maxPatients).toBe(2);
      expect(updated.body.setting.maxProfessionals).toBe(2);
    });
  });

  describe("lookups", () => {
    it("busca pacientes e profissionais por termo", async () => {
      const { adminToken, paciente, profissional } = await seedAgendaBase();

      const patients = await withAuth(request(app)
        .get("/api/agenda/lookups/patients"), adminToken)
        .query({ q: "Paciente" });
      expect(patients.status).toBe(200);
      expect(patients.body.items.some((item: { _id: string }) => item._id === paciente._id)).toBe(
        true,
      );

      const professionals = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({ q: "Profissional" });
      expect(professionals.status).toBe(200);
      expect(
        professionals.body.items.some(
          (item: { _id: string }) => item._id === profissional._id,
        ),
      ).toBe(true);
    });

    it("retorna lista vazia sem termo de busca", async () => {
      const { adminToken } = await seedAgendaBase();

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/patients"), adminToken)
        .query({ q: "   " });
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it("retorna resumo de disponibilidade sem listar todos os profissionais", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      await createUser({
        name: "Profissional Livre",
        email: `prof-livre-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "TECNICO",
      });

      const startAt = "2026-06-05T14:00:00.000Z";
      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
            durationMinutes: 30,
          }),
        );

      const summary = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          summaryOnly: "true",
        });

      expect(summary.status).toBe(200);
      expect(summary.body.items).toEqual([]);
      expect(summary.body.meta.availableCount).toBeGreaterThanOrEqual(1);
      expect(summary.body.meta.totalCount).toBeGreaterThanOrEqual(2);
    });

    it("busca profissionais disponíveis por termo no intervalo", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const profissionalLivre = await createUser({
        name: "Profissional Livre",
        email: `prof-livre-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "TECNICO",
      });

      const startAt = "2026-06-05T14:00:00.000Z";
      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
            durationMinutes: 30,
          }),
        );

      const availableOnly = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          availableOnly: "true",
          q: "Livre",
        });

      expect(availableOnly.status).toBe(200);
      expect(availableOnly.body.meta.requiresSearch).toBeFalsy();
      expect(
        availableOnly.body.items.some(
          (item: { _id: string }) => item._id === profissionalLivre._id,
        ),
      ).toBe(true);
      expect(
        availableOnly.body.items.some(
          (item: { _id: string }) => item._id === profissional._id,
        ),
      ).toBe(false);
    });

    it("lista todos os profissionais com status no horário sem termo de busca", async () => {
      const { adminToken, profissional } = await seedAgendaBase();

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt: "2026-06-05T14:00:00.000Z",
          durationMinutes: 30,
          availableOnly: "false",
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.items.some(
          (item: { _id: string; isAvailable: boolean }) =>
            item._id === profissional._id && item.isAvailable === true,
        ),
      ).toBe(true);
    });

    it("marca profissional ocupado quando availableOnly é false", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const startAt = "2026-06-06T15:00:00.000Z";

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
          }),
        );

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          availableOnly: "false",
          q: "Profissional",
        });

      expect(response.status).toBe(200);
      const busy = response.body.items.find(
        (item: { _id: string }) => item._id === profissional._id,
      );
      expect(busy).toBeTruthy();
      expect(busy.isAvailable).toBe(false);
      expect(busy.conflictSession).toBeTruthy();
      expect(busy.conflictSession.sessionTypeName).toBe("PSICOPED");
    });

    it("ignora sessão cancelada na disponibilidade", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const startAt = "2026-06-07T16:00:00.000Z";

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
          }),
        );
      expect(created.status).toBe(201);

      await withAuth(request(app)
        .patch(`/api/agenda/sessions/${created.body.session._id}/cancel`), adminToken)
        .send({ cancelReason: "Teste cancelamento disponibilidade" });

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          availableOnly: "false",
          q: "Profissional",
        });

      const professional = response.body.items.find(
        (item: { _id: string }) => item._id === profissional._id,
      );
      expect(professional.isAvailable).toBe(true);
      expect(professional.conflictSession).toBeNull();
    });

    it("exclui a própria sessão do conflito com excludeSessionId", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const startAt = "2026-06-08T11:00:00.000Z";

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
          }),
        );
      expect(created.status).toBe(201);

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          availableOnly: "false",
          q: "Profissional",
          excludeSessionId: created.body.session._id,
        });

      const professional = response.body.items.find(
        (item: { _id: string }) => item._id === profissional._id,
      );
      expect(professional.isAvailable).toBe(true);
    });

    it("busca pacientes disponíveis por termo no intervalo informado", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const pacienteLivre = await createPatient({
        fullName: "Paciente Livre",
        birthDate: new Date("2017-03-03"),
        guardianName: "Responsavel Livre",
        phone: "(47) 99999-0099",
        fundingSource: "MUNICIPAL",
        isActive: true,
      });

      const startAt = "2026-06-09T12:00:00.000Z";
      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt,
          }),
        );

      const response = await withAuth(request(app)
        .get("/api/agenda/lookups/patients"), adminToken)
        .query({
          startAt,
          durationMinutes: 30,
          availableOnly: "true",
          q: "Livre",
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.some(
          (item: { _id: string }) => item._id === pacienteLivre._id,
        ),
      ).toBe(true);
      expect(
        response.body.items.some((item: { _id: string }) => item._id === paciente._id),
      ).toBe(false);
    });
  });

  describe("sessões — criação e validação", () => {
    it("impede conflito de sala na criação de sessão", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const paciente2 = await createPatient({
        fullName: "Paciente Dois",
        birthDate: new Date("2017-02-02"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
        fundingSource: "ESTADUAL",
        isActive: true,
      });

      const payload = buildSessionPayload({
        sessionTypeId: sessionType._id,
        roomId: room._id,
        patientIds: [paciente._id],
        professionalIds: [profissional._id],
        startAt: "2026-06-01T13:00:00.000Z",
      });

      const first = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(payload);
      expect(first.status).toBe(201);

      const conflicting = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send({
          ...payload,
          startAt: "2026-06-01T13:15:00.000Z",
          patientIds: [paciente2._id],
        });

      expect(conflicting.status).toBe(409);
      expect(conflicting.body.message).toContain("sala já está ocupada");
      expect(conflicting.body.code).toBe("ConflictError");
    });

    it("impede conflito de profissional e de paciente", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const room2 = await createRoom({ name: "Sala 2", isActive: true });
      const basePayload = buildSessionPayload({
        sessionTypeId: sessionType._id,
        roomId: room._id,
        patientIds: [paciente._id],
        professionalIds: [profissional._id],
        startAt: "2026-06-03T10:00:00.000Z",
      });

      await withAuth(request(app).post("/api/agenda/sessions"), adminToken).send(basePayload);

      const profConflict = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send({
          ...basePayload,
          roomId: room2._id,
          startAt: "2026-06-03T10:15:00.000Z",
        });
      expect(profConflict.status).toBe(409);
      expect(profConflict.body.message).toContain("profissionais");

      const patientConflict = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send({
          ...basePayload,
          roomId: room2._id,
          startAt: "2026-06-03T10:20:00.000Z",
          professionalIds: [
            (
              await createUser({
                name: "Outro Prof",
                email: `outro-${Date.now()}@amaitajai.org.br`,
                password: "x",
                role: "TECNICO",
              })
            )._id,
          ],
        });
      expect(patientConflict.status).toBe(409);
      expect(patientConflict.body.message).toContain("usuários");
    });

    it("rejeita sessão dupla sem quantidade correta de participantes", async () => {
      const { adminToken, paciente, profissional, room } = await seedAgendaBase();
      const type = await createSessionType({
        name: "FONO",
        slug: "fono-dupla-test",
        defaultDurationMinutes: 60,
        isDurationFlexible: false,
        allowedModalities: ["DUPLA"],
        isActive: true,
      });

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: type._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            modality: "DUPLA",
            durationMinutes: 60,
            startAt: "2026-05-06T15:00:00.000Z",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Dupla");
      expect(response.body.message).toContain("2");
    });

    it("aplica limites configurados no cadastro geral de tipos de sessão", async () => {
      const { adminToken, paciente, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Limites 2",
        birthDate: new Date("2017-02-02"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
        fundingSource: "ESTADUAL",
        isActive: true,
      });
      const paciente3 = await createPatient({
        fullName: "Paciente Limites 3",
        birthDate: new Date("2017-03-03"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
        fundingSource: "ESTADUAL",
        isActive: true,
      });
      const profissional1 = await createUser({
        name: "Prof Limites 1",
        email: `prof-limites-1-${Date.now()}@amaitajai.org.br`,
        password: "prof123456",
        role: "TECNICO",
      });
      const profissional2 = await createUser({
        name: "Prof Limites 2",
        email: `prof-limites-2-${Date.now()}@amaitajai.org.br`,
        password: "prof123456",
        role: "TECNICO",
      });

      await withAuth(request(app)
        .patch("/api/agenda/session-modalities/GRUPO"), adminToken)
        .send({
          minPatients: 1,
          maxPatients: 2,
          minProfessionals: 1,
          maxProfessionals: 2,
          isActive: true,
        });

      const groupType = await createSessionType({
        name: "Grupo Terapêutico",
        slug: `grupo-limites-${Date.now()}`,
        defaultDurationMinutes: 60,
        isDurationFlexible: false,
        allowedModalities: ["GRUPO"],
        isActive: true,
      });

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id, paciente3._id],
            professionalIds: [profissional1._id, profissional2._id],
            modality: "GRUPO",
            durationMinutes: 60,
            startAt: "2026-06-10T13:00:00.000Z",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("entre 1 e 2 usuários");
    });

    it("rejeita modalidade não permitida pelo tipo de sessão", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const profissional2 = await createUser({
        name: "Profissional Grupo",
        email: `prof-grupo-${Date.now()}@amaitajai.org.br`,
        password: "prof123456",
        role: "TECNICO",
      });

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "GRUPO",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("não permite");
    });

    it("rejeita referências inativas", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      await prisma.room.update({
        where: { id: room._id },
        data: { isActive: false },
      });

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("sala");
    });
  });

  describe("sessões — listagem, edição, cancelamento e conclusão", () => {
    it("lista sessões com filtro de status para admin", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );

      const list = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ status: "AGENDADA" });
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBe(1);
    });

    it("técnico vê apenas sessões próprias na listagem", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const outroProf = await createUser({
        name: "Outro",
        email: `outro2-${Date.now()}@amaitajai.org.br`,
        password: "outro123456",
        role: "TECNICO",
      });

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-04T08:00:00.000Z",
          }),
        );

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [outroProf._id],
            startAt: "2026-06-04T09:00:00.000Z",
          }),
        );

      const techToken = await loginAs(profissional.email, "prof123456");
      const list = await withAuth(request(app).get("/api/agenda/sessions"), techToken);
      expect(list.status).toBe(200);
      expect(list.body.items).toHaveLength(1);
      expect(list.body.items[0].professionalIds[0]._id).toBe(profissional._id);
    });

    it("atualiza sessão e bloqueia edição de sessão cancelada", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      const updated = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}`), adminToken)
        .send({ notes: "Observação atualizada" });
      expect(updated.status).toBe(200);
      expect(updated.body.session.notes).toBe("Observação atualizada");

      await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`), adminToken)
        .send({ cancelReason: "Paciente ausente" });

      const blocked = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}`), adminToken)
        .send({ notes: "Tentativa após cancelar" });
      expect(blocked.status).toBe(400);
      expect(blocked.body.message).toContain("cancelada");
    });

    it("cancela sessão exigindo motivo", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      const missingReason = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`), adminToken)
        .send({ cancelReason: "  " });
      expect(missingReason.status).toBe(400);

      const cancelled = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`), adminToken)
        .send({ cancelReason: "Reagendamento" });
      expect(cancelled.status).toBe(200);
      expect(cancelled.body.session.status).toBe("CANCELADA");

      const defaultList = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken);
      expect(defaultList.status).toBe(200);
      expect(defaultList.body.items.some((item: { _id: string }) => item._id === sessionId)).toBe(
        false,
      );

      const cancelledList = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ status: "CANCELADA" });
      expect(cancelledList.status).toBe(200);
      expect(cancelledList.body.items.some((item: { _id: string }) => item._id === sessionId)).toBe(
        true,
      );
    });

    it("pagina sessões por paciente quando page e limit são informados", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      for (let index = 0; index < 3; index += 1) {
        const day = String(10 + index).padStart(2, "0");
        await withAuth(request(app)
          .post("/api/agenda/sessions"), adminToken)
          .send(
            buildSessionPayload({
              sessionTypeId: sessionType._id,
              roomId: room._id,
              patientIds: [paciente._id],
              professionalIds: [profissional._id],
              startAt: `2026-06-${day}T10:00:00.000Z`,
            }),
          );
      }

      const page1 = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ patientId: paciente._id, includeCancelled: "true", page: 1, limit: 2 });
      expect(page1.status).toBe(200);
      expect(page1.body.items).toHaveLength(2);
      expect(page1.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });

      const page2 = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ patientId: paciente._id, includeCancelled: "true", page: 2, limit: 2 });
      expect(page2.status).toBe(200);
      expect(page2.body.items).toHaveLength(1);
    });

    it("inclui presença do paciente filtrado no histórico por paciente", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-15T10:00:00.000Z",
          }),
        );
      const sessionId = created.body.session._id as string;

      await withAuth(request(app)
        .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
        .send({ status: "FALTA_JUSTIFICADA", justification: "Consulta médica" });

      const patientHistory = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ patientId: paciente._id, includeCancelled: "true" });

      expect(patientHistory.status).toBe(200);
      expect(patientHistory.body.items).toHaveLength(1);
      expect(patientHistory.body.items[0].patientAttendance).toEqual({
        status: "FALTA_JUSTIFICADA",
        justification: "Consulta médica",
      });
    });

    it("não expõe presença automática em sessão futura no histórico por paciente", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: futureStart,
          }),
        );

      const patientHistory = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ patientId: paciente._id, includeCancelled: "true" });

      expect(patientHistory.status).toBe(200);
      expect(patientHistory.body.items).toHaveLength(1);
      expect(patientHistory.body.items[0].patientAttendance).toBeUndefined();
    });

    it("filtra sessões por paciente e inclui canceladas com includeCancelled", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`), adminToken)
        .send({ cancelReason: "Teste histórico paciente" });

      const patientHistory = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ patientId: paciente._id, includeCancelled: "true" });
      expect(patientHistory.status).toBe(200);
      expect(patientHistory.body.items).toHaveLength(1);
      expect(patientHistory.body.items[0].status).toBe("CANCELADA");
    });

    it("permite técnico concluir somente sessão própria", async () => {
      const adminPassword = "admin123456";
      const tecnicoApassword = "techA123456";
      const tecnicoBpassword = "techB123456";

      const admin = await createUser({
        name: "Admin",
        email: "admin3@amaitajai.org.br",
        password: adminPassword,
        role: "ADMINISTRADOR",
      });
      const tecnicoA = await createUser({
        name: "Tecnico A",
        email: "tecnicoa@amaitajai.org.br",
        password: tecnicoApassword,
        role: "TECNICO",
      });
      const tecnicoB = await createUser({
        name: "Tecnico B",
        email: "tecnicob@amaitajai.org.br",
        password: tecnicoBpassword,
        role: "TECNICO",
      });

      const paciente = await createPatient({
        fullName: "Paciente Tres",
        birthDate: new Date("2016-03-03"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
        fundingSource: "PARTICULAR",
        isActive: true,
      });
      const room = await createRoom({ name: "Sala Sessao", isActive: true });
      const type = await createSessionType({
        name: "INTENSIVO",
        slug: "intensivo",
        defaultDurationMinutes: 60,
        isDurationFlexible: true,
        allowedModalities: ["INDIVIDUAL"],
        isActive: true,
      });

      const adminToken = await loginAs(admin.email, adminPassword);
      const tecnicoAToken = await loginAs(tecnicoA.email, tecnicoApassword);
      const tecnicoBToken = await loginAs(tecnicoB.email, tecnicoBpassword);

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send({
          sessionTypeId: type._id,
          modality: "INDIVIDUAL",
          roomId: room._id,
          startAt: "2026-06-02T14:00:00.000Z",
          durationMinutes: 60,
          patientIds: [paciente._id],
          professionalIds: [tecnicoA._id],
        });
      expect(created.status).toBe(201);

      const sessionId = created.body.session._id as string;

      const forbidden = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`), tecnicoBToken)
        .send();
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.code).toBe("ForbiddenError");

      const completed = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`), tecnicoAToken)
        .send();
      expect(completed.status).toBe(200);
      expect(completed.body.session.status).toBe("REALIZADA");
    });

    it("impede concluir sessão cancelada", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`), adminToken)
        .send({ cancelReason: "Teste" });

      const response = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`), adminToken)
        .send();
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("cancelada");
    });

    it("retorna 404 para sessão inexistente", async () => {
      const { adminToken } = await seedAgendaBase();
      const fakeId = randomUUID();

      const response = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${fakeId}/complete`), adminToken)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NotFoundError");
    });
  });

  describe("sessões recorrentes", () => {
    it("cria série semanal e gera múltiplas sessões", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );

      expect(created.status).toBe(201);
      expect(created.body.sessionsCreated).toBeGreaterThan(1);
      expect(created.body.series.weekdays).toEqual([1, 3]);

      const list = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBe(created.body.sessionsCreated);
      expect(list.body.items.every((item: { seriesId: string | null }) => item.seriesId)).toBe(true);
    });

    it("bloqueia criação recorrente quando há conflito em alguma data", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-03T13:00:00.000Z",
          }),
        );

      const blocked = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );

      expect(blocked.status).toBe(409);
      expect(blocked.body.message).toContain("Conflito");

      const list = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      expect(list.body.items).toHaveLength(1);
    });

    it("cancela com escopo futuro e todos", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );
      expect(created.status).toBe(201);

      const list = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const sessions = list.body.items as Array<{ _id: string; startAt: string; status: string }>;
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
      const middleSession = sorted[Math.floor(sorted.length / 2)];

      const cancelFuture = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${middleSession._id}/cancel`), adminToken)
        .send({ cancelReason: "Interrupção parcial", scope: "FUTURE" });
      expect(cancelFuture.status).toBe(200);
      expect(cancelFuture.body.sessionsCancelled).toBeGreaterThan(1);

      const afterFuture = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const stillAgendada = afterFuture.body.items.filter(
        (item: { status: string }) => item.status === "AGENDADA",
      );
      expect(stillAgendada.length).toBeGreaterThan(0);
      expect(stillAgendada.length).toBeLessThan(sessions.length);

      const created2 = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-07-01T13:00:00.000Z",
            weekdays: [2],
            endsAt: "2026-07-31",
          }),
        );
      expect(created2.status).toBe(201);

      const list2 = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const seriesSessions = (list2.body.items as Array<{ _id: string; seriesId: string | null }>).filter(
        (item) => item.seriesId === created2.body.series._id,
      );
      const firstSeriesSession = seriesSessions[0];

      const cancelAll = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${firstSeriesSession._id}/cancel`), adminToken)
        .send({ cancelReason: "Encerramento", scope: "ALL" });
      expect(cancelAll.status).toBe(200);
      expect(cancelAll.body.sessionsCancelled).toBe(seriesSessions.length);
    });

    it("edita sessões recorrentes com escopo futuro e todos", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );
      expect(created.status).toBe(201);

      const list = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const sessions = list.body.items as Array<{ _id: string; startAt: string; notes: string }>;
      const sorted = [...sessions].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
      const middleSession = sorted[Math.floor(sorted.length / 2)];

      const updatedFuture = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${middleSession._id}`), adminToken)
        .send({ notes: "Série ajustada", updateScope: "FUTURE" });
      expect(updatedFuture.status).toBe(200);
      expect(updatedFuture.body.sessionsUpdated).toBeGreaterThan(1);

      const afterFuture = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const withNotes = afterFuture.body.items.filter(
        (item: { notes: string }) => item.notes === "Série ajustada",
      );
      expect(withNotes.length).toBe(updatedFuture.body.sessionsUpdated);

      const created2 = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-07-01T13:00:00.000Z",
            weekdays: [2],
            endsAt: "2026-07-31",
          }),
        );
      expect(created2.status).toBe(201);

      const list2 = await withAuth(request(app).get("/api/agenda/sessions"), adminToken);
      const seriesSessions = (list2.body.items as Array<{ _id: string; seriesId: string | null }>).filter(
        (item) => item.seriesId === created2.body.series._id,
      );
      const firstSeriesSession = seriesSessions[0];

      const updatedAll = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${firstSeriesSession._id}`), adminToken)
        .send({ notes: "Série completa ajustada", updateScope: "ALL" });
      expect(updatedAll.status).toBe(200);
      expect(updatedAll.body.sessionsUpdated).toBe(seriesSessions.length);
    });
  });

  describe("profissionais de apoio em sessão grupo", () => {
    async function seedGrupoBase() {
      const base = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Grupo 2",
        birthDate: new Date("2018-02-01"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
      });
      const profissional2 = await createUser({
        name: "Profissional Grupo 2",
        email: `prof-grupo-2-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "TECNICO",
      });
      const groupType = await createSessionType({
        name: "Grupo Apoio",
        slug: `grupo-apoio-${Date.now()}`,
        defaultDurationMinutes: 120,
        allowedModalities: ["GRUPO"],
      });

      return {
        ...base,
        paciente2,
        profissional2,
        groupType,
      };
    }

    it("persiste profissional de apoio com horários parciais", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-10T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T10:15:00.000Z",
                participationEndAt: "2026-06-10T10:45:00.000Z",
              },
            ],
          }),
        );

      expect(response.status).toBe(201);
      const apoio = response.body.session.professionalIds.find(
        (item: { _id: string; isApoio: boolean }) => item._id === profissional2._id,
      );
      expect(apoio.isApoio).toBe(true);
      expect(apoio.participationStartAt).toBe("2026-06-10T10:15:00.000Z");
      expect(apoio.participationEndAt).toBe("2026-06-10T10:45:00.000Z");
    });

    it("rejeita apoio fora dos limites da sessão", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-10T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T09:45:00.000Z",
                participationEndAt: "2026-06-10T10:30:00.000Z",
              },
            ],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("início da sessão");
    });

    it("rejeita apoio em modalidade individual", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            modality: "INDIVIDUAL",
            professionals: [
              {
                professionalId: profissional._id,
                isApoio: true,
                participationStartAt: "2026-06-10T13:00:00.000Z",
                participationEndAt: "2026-06-10T13:30:00.000Z",
              },
            ],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("sessões em grupo");
    });

    it("permite nova sessão após término do apoio parcial", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();
      const room2 = await createRoom({ name: `Sala Apoio ${Date.now()}` });
      const profissional3 = await createUser({
        name: "Profissional Grupo 3",
        email: `prof-grupo-3-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "TECNICO",
      });
      const paciente3 = await createPatient({
        fullName: "Paciente Grupo 3",
        birthDate: new Date("2018-03-01"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
      });
      const paciente4 = await createPatient({
        fullName: "Paciente Grupo 4",
        birthDate: new Date("2018-04-01"),
        guardianName: "Responsavel 4",
        phone: "(47) 99999-0004",
      });

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-10T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T10:00:00.000Z",
                participationEndAt: "2026-06-10T10:30:00.000Z",
              },
            ],
          }),
        );

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room2._id,
            patientIds: [paciente3._id, paciente4._id],
            modality: "GRUPO",
            durationMinutes: 60,
            startAt: "2026-06-10T10:30:00.000Z",
            professionalIds: [profissional2._id, profissional3._id],
          }),
        );

      expect(response.status).toBe(201);
    });

    it("bloqueia conflito parcial de apoio", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();
      const room2 = await createRoom({ name: `Sala Apoio Conflito ${Date.now()}` });

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-10T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T10:00:00.000Z",
                participationEndAt: "2026-06-10T10:30:00.000Z",
              },
            ],
          }),
        );

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room2._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 60,
            startAt: "2026-06-10T10:15:00.000Z",
            professionalIds: [profissional2._id, profissional._id],
          }),
        );

      expect(response.status).toBe(409);
      expect(response.body.message).toContain("profissionais");
    });

    it("marca profissional disponível fora da janela de apoio existente", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();

      await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-10T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T10:00:00.000Z",
                participationEndAt: "2026-06-10T10:30:00.000Z",
              },
            ],
          }),
        );

      const lookup = await withAuth(request(app)
        .get("/api/agenda/lookups/professionals")
        .query({
          startAt: "2026-06-10T10:30:00.000Z",
          durationMinutes: 60,
          availableOnly: "false",
        }), adminToken);

      expect(lookup.status).toBe(200);
      const prof2 = lookup.body.items.find(
        (item: { _id: string }) => item._id === profissional2._id,
      );
      expect(prof2.isAvailable).toBe(true);
    });

    it("replica horário fixo de apoio em sessão recorrente", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send({
          ...buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 120,
            startAt: "2026-06-02T10:00:00.000Z",
            professionals: [
              { professionalId: profissional._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-02T10:15:00.000Z",
                participationEndAt: "2026-06-02T10:45:00.000Z",
              },
            ],
          }),
          recurrence: {
            enabled: true,
            weekdays: [1, 3],
            endsAt: "2026-06-16",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.sessionsCreated).toBeGreaterThan(1);

      const list = await withAuth(request(app)
        .get("/api/agenda/sessions")
        .query({ startAt: "2026-06-01", endAt: "2026-06-30" }), adminToken);

      const seriesSessions = list.body.items.filter(
        (item: { seriesId: string | null }) => item.seriesId === response.body.series._id,
      );
      expect(seriesSessions.length).toBeGreaterThan(1);

      for (const session of seriesSessions) {
        const apoio = session.professionalIds.find(
          (item: { _id: string; isApoio: boolean }) => item._id === profissional2._id,
        );
        expect(apoio.isApoio).toBe(true);
        expect(new Date(apoio.participationStartAt).getUTCHours()).toBe(10);
        expect(new Date(apoio.participationStartAt).getUTCMinutes()).toBe(15);
        expect(new Date(apoio.participationEndAt).getUTCHours()).toBe(10);
        expect(new Date(apoio.participationEndAt).getUTCMinutes()).toBe(45);
      }
    });

    it("permite apoio antes de conflito que ocupa só parte da sessão", async () => {
      const { adminToken, paciente, paciente2, profissional, profissional2, room, groupType } =
        await seedGrupoBase();
      const room2 = await createRoom({ name: `Sala Apoio Parcial ${Date.now()}` });
      const profissional3 = await createUser({
        name: "Profissional Grupo 3",
        email: `prof-grupo-3-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "TECNICO",
      });
      const paciente3 = await createPatient({
        fullName: "Paciente Grupo 3",
        birthDate: new Date("2018-03-01"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
      });
      const paciente4 = await createPatient({
        fullName: "Paciente Grupo 4",
        birthDate: new Date("2018-04-01"),
        guardianName: "Responsavel 4",
        phone: "(47) 99999-0004",
      });

      const existing = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            modality: "GRUPO",
            durationMinutes: 60,
            startAt: "2026-06-10T08:00:00.000Z",
            professionalIds: [profissional2._id, profissional._id],
          }),
        );
      expect(existing.status).toBe(201);

      const response = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room2._id,
            patientIds: [paciente3._id, paciente4._id],
            modality: "GRUPO",
            durationMinutes: 60,
            startAt: "2026-06-10T07:30:00.000Z",
            professionals: [
              { professionalId: profissional3._id, isApoio: false },
              {
                professionalId: profissional2._id,
                isApoio: true,
                participationStartAt: "2026-06-10T07:30:00.000Z",
                participationEndAt: "2026-06-10T08:00:00.000Z",
              },
            ],
          }),
        );

      expect(response.status).toBe(201);
    });
  });

  describe("pedidos de alteração de sessão", () => {
    it("permite técnico solicitar edição da própria sessão e admin aprovar", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const tecnicoToken = await loginAs(profissional.email, "prof123456");

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-10T13:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;

      const editPayload = buildSessionPayload({
        sessionTypeId: sessionType._id,
        roomId: room._id,
        patientIds: [paciente._id],
        professionalIds: [profissional._id],
        startAt: "2026-06-10T15:00:00.000Z",
        notes: "Pedido de remarcação",
      });

      const requested = await withAuth(request(app)
        .post(`/api/agenda/sessions/${sessionId}/change-requests/edit`), tecnicoToken)
        .send({ ...editPayload, updateScope: "SINGLE" });
      expect(requested.status).toBe(201);
      expect(requested.body.request.status).toBe("PENDENTE");
      expect(requested.body.request.type).toBe("EDIT");

      const requestId = requested.body.request._id as string;

      const blocked = await withAuth(request(app)
        .patch(`/api/agenda/sessions/${sessionId}`), adminToken)
        .send({ ...editPayload, updateScope: "SINGLE" });
      expect(blocked.status).toBe(400);
      expect(blocked.body.message).toContain("pedido de alteração pendente");

      const forbidden = await withAuth(request(app)
        .patch(`/api/agenda/session-change-requests/${requestId}/approve`), tecnicoToken)
        .send();
      expect(forbidden.status).toBe(403);

      const approved = await withAuth(request(app)
        .patch(`/api/agenda/session-change-requests/${requestId}/approve`), adminToken)
        .send();
      expect(approved.status).toBe(200);
      expect(approved.body.request.status).toBe("APROVADO");
      expect(approved.body.session.startAt).toBe("2026-06-10T15:00:00.000Z");
      expect(approved.body.session.notes).toBe("Pedido de remarcação");
    });

    it("bloqueia técnico de solicitar alteração em sessão alheia", async () => {
      const adminPassword = "admin123456";
      const techPassword = "tech123456";
      const otherPassword = "other123456";

      const admin = await createUser({
        name: "Admin Pedido",
        email: `admin-pedido-${Date.now()}@agenda.test`,
        password: adminPassword,
        role: "ADMINISTRADOR",
      });
      const tecnico = await createUser({
        name: "Tecnico Pedido",
        email: `tecnico-pedido-${Date.now()}@agenda.test`,
        password: techPassword,
        role: "TECNICO",
      });
      const outro = await createUser({
        name: "Outro Tecnico",
        email: `outro-pedido-${Date.now()}@agenda.test`,
        password: otherPassword,
        role: "TECNICO",
      });

      const fundingSources = await prisma.patientFundingSource.findMany();
      const paciente = await createPatient({
        fullName: "Paciente Pedido",
        birthDate: new Date("2018-01-01"),
        guardianName: "Responsavel",
        phone: "(47) 99999-0099",
        fundingSource: fundingSources[0]?.name ?? "PARTICULAR",
        isActive: true,
      });
      const room = await createRoom({ name: `Sala Pedido ${Date.now()}`, isActive: true });
      const sessionType = await createSessionType({
        name: "PEDIDO",
        slug: `pedido-${Date.now()}`,
        defaultDurationMinutes: 30,
        isDurationFlexible: false,
        allowedModalities: ["INDIVIDUAL"],
        isActive: true,
      });

      const adminToken = await loginAs(admin.email, adminPassword);
      const outroToken = await loginAs(outro.email, otherPassword);

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [tecnico._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      const response = await withAuth(request(app)
        .post(`/api/agenda/sessions/${sessionId}/change-requests/edit`), outroToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [tecnico._id],
            startAt: "2026-06-10T16:00:00.000Z",
            updateScope: "SINGLE",
          }),
        );
      expect(response.status).toBe(403);
    });

    it("permite admin aprovar pedido de cancelamento e rejeitar com motivo", async () => {
      const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const tecnicoToken = await loginAs(profissional.email, "prof123456");

      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
          }),
        );
      const sessionId = created.body.session._id as string;

      const cancelRequested = await withAuth(request(app)
        .post(`/api/agenda/sessions/${sessionId}/change-requests/cancel`), tecnicoToken)
        .send({ cancelReason: "Paciente viajou", scope: "SINGLE" });
      expect(cancelRequested.status).toBe(201);
      const cancelRequestId = cancelRequested.body.request._id as string;

      const approved = await withAuth(request(app)
        .patch(`/api/agenda/session-change-requests/${cancelRequestId}/approve`), adminToken)
        .send();
      expect(approved.status).toBe(200);
      expect(approved.body.request.status).toBe("APROVADO");
      expect(approved.body.session.status).toBe("CANCELADA");

      const created2 = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-11T13:00:00.000Z",
          }),
        );
      const sessionId2 = created2.body.session._id as string;

      const rejectRequested = await withAuth(request(app)
        .post(`/api/agenda/sessions/${sessionId2}/change-requests/cancel`), tecnicoToken)
        .send({ cancelReason: "Conflito de horário", scope: "SINGLE" });
      const rejectRequestId = rejectRequested.body.request._id as string;

      const rejected = await withAuth(request(app)
        .patch(`/api/agenda/session-change-requests/${rejectRequestId}/reject`), adminToken)
        .send({ rejectionReason: "Manter sessão agendada" });
      expect(rejected.status).toBe(200);
      expect(rejected.body.request.status).toBe("REJEITADO");
      expect(rejected.body.request.rejectionReason).toBe("Manter sessão agendada");

      const sessionAfterReject = await withAuth(request(app)
        .get("/api/agenda/sessions"), adminToken)
        .query({ startAt: "2026-06-11T00:00:00.000Z", endAt: "2026-06-12T00:00:00.000Z" });
      const stillScheduled = sessionAfterReject.body.items.find(
        (item: { _id: string }) => item._id === sessionId2,
      );
      expect(stillScheduled?.status).toBe("AGENDADA");
    });
  });
});
