import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../app.js";
import { Patient } from "../models/patient.model.js";
import { Room } from "../models/room.model.js";
import { SessionType } from "../models/session-type.model.js";
import {
  buildSessionPayload,
  createUser,
  loginAndGetCookie,
  seedAgendaBase,
} from "./agenda.integration.helpers.js";

describe("Agenda integration", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_MONGODB_URI as string, {
      serverSelectionTimeoutMS: 2000,
    });

    const activeDbName = mongoose.connection.db?.databaseName;
    if (!activeDbName?.startsWith("gestao_amaitajai_test_")) {
      throw new Error("Os testes só podem rodar em banco dedicado de teste.");
    }
  }, 15000);

  beforeEach(async () => {
    const database = mongoose.connection.db;
    if (!database) {
      throw new Error("Conexão de banco indisponível para testes.");
    }
    await database.dropDatabase();
  });

  afterAll(async () => {
    const database = mongoose.connection.db;
    if (database?.databaseName.startsWith("gestao_amaitajai_test_")) {
      await database.dropDatabase();
    }
    await mongoose.disconnect();
  }, 15000);

  describe("autenticação e autorização", () => {
    it("bloqueia criação de sala para técnico e permite para administrador", async () => {
      const adminPassword = "admin123456";
      const techPassword = "tech123456";
      const admin = await createUser({
        name: "Admin",
        email: "admin@agenda.test",
        password: adminPassword,
        role: "administrador",
      });
      const tecnico = await createUser({
        name: "Tecnico",
        email: "tecnico@agenda.test",
        password: techPassword,
        role: "tecnico",
      });

      expect(admin.role).toBe("administrador");
      expect(tecnico.role).toBe("tecnico");

      const adminCookie = await loginAndGetCookie(admin.email, adminPassword);
      const tecnicoCookie = await loginAndGetCookie(tecnico.email, techPassword);

      const forbidden = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", tecnicoCookie)
        .send({ name: "Sala T1" });
      expect(forbidden.status).toBe(403);

      const created = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
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
      const { adminCookie } = await seedAgendaBase();
      await Room.collection.createIndex({ name: 1 }, { unique: true });

      const empty = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "   " });
      expect(empty.status).toBe(400);
      expect(empty.body.code).toBe("ValidationError");

      await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "Sala Única" });

      const duplicate = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "Sala Única" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.code).toBe("ConflictError");
    });

    it("lista, atualiza e altera status da sala", async () => {
      const { adminCookie } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/rooms")
        .set("Cookie", adminCookie)
        .send({ name: "Sala Editável" });
      const roomId = created.body.room._id as string;

      const list = await request(app).get("/api/agenda/rooms").set("Cookie", adminCookie);
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBeGreaterThanOrEqual(2);

      const updated = await request(app)
        .patch(`/api/agenda/rooms/${roomId}`)
        .set("Cookie", adminCookie)
        .send({ name: "Sala Renomeada" });
      expect(updated.status).toBe(200);
      expect(updated.body.room.name).toBe("Sala Renomeada");

      const deactivated = await request(app)
        .patch(`/api/agenda/rooms/${roomId}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.room.isActive).toBe(false);
    });

    it("rejeita isActive inválido no status da sala", async () => {
      const { adminCookie, room } = await seedAgendaBase();

      const response = await request(app)
        .patch(`/api/agenda/rooms/${room._id.toString()}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: "sim" });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("booleano");
    });
  });

  describe("tipos de sessão", () => {
    it("cria tipo de sessão e rejeita dados inválidos", async () => {
      const { adminCookie } = await seedAgendaBase();

      const invalid = await request(app)
        .post("/api/agenda/session-types")
        .set("Cookie", adminCookie)
        .send({ name: "", defaultDurationMinutes: 0, allowedModalities: [] });
      expect(invalid.status).toBe(400);

      const created = await request(app)
        .post("/api/agenda/session-types")
        .set("Cookie", adminCookie)
        .send({
          name: "FONOAUDIOLOGIA",
          defaultDurationMinutes: 45,
          isDurationFlexible: true,
          allowedModalities: ["individual", "grupo"],
        });
      expect(created.status).toBe(201);
      expect(created.body.sessionType.allowedModalities).toContain("grupo");
    });

    it("rejeita tea-14-plus com modalidade diferente de grupo", async () => {
      const { adminCookie } = await seedAgendaBase();

      const response = await request(app)
        .post("/api/agenda/session-types")
        .set("Cookie", adminCookie)
        .send({
          name: "TEA 14 Plus",
          defaultDurationMinutes: 60,
          allowedModalities: ["individual"],
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("tea-14-plus");
    });

    it("lista e atualiza tipo de sessão", async () => {
      const { adminCookie, sessionType } = await seedAgendaBase();

      const list = await request(app)
        .get("/api/agenda/session-types")
        .set("Cookie", adminCookie);
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBeGreaterThanOrEqual(1);

      const updated = await request(app)
        .patch(`/api/agenda/session-types/${sessionType._id.toString()}`)
        .set("Cookie", adminCookie)
        .send({ defaultDurationMinutes: 50 });
      expect(updated.status).toBe(200);
      expect(updated.body.sessionType.defaultDurationMinutes).toBe(50);
    });
  });

  describe("tipos de sessão (cadastros gerais)", () => {
    it("lista e atualiza limites por tipo de sessão", async () => {
      const { adminCookie } = await seedAgendaBase();

      const list = await request(app).get("/api/agenda/session-modalities").set("Cookie", adminCookie);
      expect(list.status).toBe(200);
      expect(list.body.items).toHaveLength(3);
      expect(list.body.items.some((item: { modality: string }) => item.modality === "grupo")).toBe(true);

      const updated = await request(app)
        .patch("/api/agenda/session-modalities/grupo")
        .set("Cookie", adminCookie)
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
      const { adminCookie, paciente, profissional } = await seedAgendaBase();

      const patients = await request(app)
        .get("/api/agenda/lookups/patients")
        .set("Cookie", adminCookie)
        .query({ q: "Paciente" });
      expect(patients.status).toBe(200);
      expect(patients.body.items.some((item: { _id: string }) => item._id === paciente._id.toString())).toBe(
        true,
      );

      const professionals = await request(app)
        .get("/api/agenda/lookups/professionals")
        .set("Cookie", adminCookie)
        .query({ q: "Profissional" });
      expect(professionals.status).toBe(200);
      expect(
        professionals.body.items.some(
          (item: { _id: string }) => item._id === profissional._id.toString(),
        ),
      ).toBe(true);
    });

    it("retorna lista vazia sem termo de busca", async () => {
      const { adminCookie } = await seedAgendaBase();

      const response = await request(app)
        .get("/api/agenda/lookups/patients")
        .set("Cookie", adminCookie)
        .query({ q: "   " });
      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });
  });

  describe("sessões — criação e validação", () => {
    it("impede conflito de sala na criação de sessão", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const paciente2 = await Patient.create({
        fullName: "Paciente Dois",
        birthDate: new Date("2017-02-02"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
        fundingSource: "Estadual",
        isActive: true,
      });

      const payload = buildSessionPayload({
        sessionTypeId: sessionType._id.toString(),
        roomId: room._id.toString(),
        patientIds: [paciente._id.toString()],
        professionalIds: [profissional._id.toString()],
        startAt: "2026-06-01T13:00:00.000Z",
      });

      const first = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(payload);
      expect(first.status).toBe(201);

      const conflicting = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send({
          ...payload,
          startAt: "2026-06-01T13:15:00.000Z",
          patientIds: [paciente2._id.toString()],
        });

      expect(conflicting.status).toBe(409);
      expect(conflicting.body.message).toContain("sala já está ocupada");
      expect(conflicting.body.code).toBe("ConflictError");
    });

    it("impede conflito de profissional e de paciente", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const room2 = await Room.create({ name: "Sala 2", isActive: true });
      const basePayload = buildSessionPayload({
        sessionTypeId: sessionType._id.toString(),
        roomId: room._id.toString(),
        patientIds: [paciente._id.toString()],
        professionalIds: [profissional._id.toString()],
        startAt: "2026-06-03T10:00:00.000Z",
      });

      await request(app).post("/api/agenda/sessions").set("Cookie", adminCookie).send(basePayload);

      const profConflict = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send({
          ...basePayload,
          roomId: room2._id.toString(),
          startAt: "2026-06-03T10:15:00.000Z",
        });
      expect(profConflict.status).toBe(409);
      expect(profConflict.body.message).toContain("profissionais");

      const patientConflict = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send({
          ...basePayload,
          roomId: room2._id.toString(),
          startAt: "2026-06-03T10:20:00.000Z",
          professionalIds: [
            (
              await createUser({
                name: "Outro Prof",
                email: `outro-${Date.now()}@agenda.test`,
                password: "x",
                role: "tecnico",
              })
            )._id.toString(),
          ],
        });
      expect(patientConflict.status).toBe(409);
      expect(patientConflict.body.message).toContain("pacientes");
    });

    it("rejeita sessão dupla sem quantidade correta de participantes", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const type = await SessionType.create({
        name: "FONO",
        slug: "fono-dupla-test",
        defaultDurationMinutes: 60,
        isDurationFlexible: false,
        allowedModalities: ["dupla"],
        isActive: true,
      });

      const response = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: type._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
            modality: "dupla",
            durationMinutes: 60,
            startAt: "2026-05-06T15:00:00.000Z",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Dupla");
      expect(response.body.message).toContain("2");
    });

    it("aplica limites configurados no cadastro geral de tipos de sessão", async () => {
      const { adminCookie, paciente, room } = await seedAgendaBase();
      const paciente2 = await Patient.create({
        fullName: "Paciente Limites 2",
        birthDate: new Date("2017-02-02"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
        fundingSource: "Estadual",
        isActive: true,
      });
      const paciente3 = await Patient.create({
        fullName: "Paciente Limites 3",
        birthDate: new Date("2017-03-03"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
        fundingSource: "Estadual",
        isActive: true,
      });
      const profissional1 = await createUser({
        name: "Prof Limites 1",
        email: `prof-limites-1-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const profissional2 = await createUser({
        name: "Prof Limites 2",
        email: `prof-limites-2-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "tecnico",
      });

      await request(app)
        .patch("/api/agenda/session-modalities/grupo")
        .set("Cookie", adminCookie)
        .send({
          minPatients: 1,
          maxPatients: 2,
          minProfessionals: 1,
          maxProfessionals: 2,
          isActive: true,
        });

      const groupType = await SessionType.create({
        name: "Grupo Terapêutico",
        slug: `grupo-limites-${Date.now()}`,
        defaultDurationMinutes: 60,
        isDurationFlexible: false,
        allowedModalities: ["grupo"],
        isActive: true,
      });

      const response = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString(), paciente2._id.toString(), paciente3._id.toString()],
            professionalIds: [profissional1._id.toString(), profissional2._id.toString()],
            modality: "grupo",
            durationMinutes: 60,
            startAt: "2026-06-10T13:00:00.000Z",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("entre 1 e 2 pacientes");
    });

    it("rejeita modalidade não permitida pelo tipo de sessão", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const profissional2 = await createUser({
        name: "Profissional Grupo",
        email: `prof-grupo-${Date.now()}@agenda.test`,
        password: "prof123456",
        role: "tecnico",
      });

      const response = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString(), profissional2._id.toString()],
            modality: "grupo",
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("não permite");
    });

    it("rejeita referências inativas", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();
      await Room.findByIdAndUpdate(room._id, { isActive: false });

      const response = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
          }),
        );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("sala");
    });
  });

  describe("sessões — listagem, edição, cancelamento e conclusão", () => {
    it("lista sessões com filtro de status para admin", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
          }),
        );

      const list = await request(app)
        .get("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .query({ status: "agendada" });
      expect(list.status).toBe(200);
      expect(list.body.items.length).toBe(1);
    });

    it("técnico vê apenas sessões próprias na listagem", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();
      const outroProf = await createUser({
        name: "Outro",
        email: `outro2-${Date.now()}@agenda.test`,
        password: "outro123456",
        role: "tecnico",
      });

      await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
            startAt: "2026-06-04T08:00:00.000Z",
          }),
        );

      await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [outroProf._id.toString()],
            startAt: "2026-06-04T09:00:00.000Z",
          }),
        );

      const techCookie = await loginAndGetCookie(profissional.email, "prof123456");
      const list = await request(app).get("/api/agenda/sessions").set("Cookie", techCookie);
      expect(list.status).toBe(200);
      expect(list.body.items).toHaveLength(1);
      expect(list.body.items[0].professionalIds[0]._id).toBe(profissional._id.toString());
    });

    it("atualiza sessão e bloqueia edição de sessão cancelada", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
          }),
        );
      const sessionId = created.body.session._id as string;

      const updated = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}`)
        .set("Cookie", adminCookie)
        .send({ notes: "Observação atualizada" });
      expect(updated.status).toBe(200);
      expect(updated.body.session.notes).toBe("Observação atualizada");

      await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`)
        .set("Cookie", adminCookie)
        .send({ cancelReason: "Paciente ausente" });

      const blocked = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}`)
        .set("Cookie", adminCookie)
        .send({ notes: "Tentativa após cancelar" });
      expect(blocked.status).toBe(400);
      expect(blocked.body.message).toContain("cancelada");
    });

    it("cancela sessão exigindo motivo", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
          }),
        );
      const sessionId = created.body.session._id as string;

      const missingReason = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`)
        .set("Cookie", adminCookie)
        .send({ cancelReason: "  " });
      expect(missingReason.status).toBe(400);

      const cancelled = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`)
        .set("Cookie", adminCookie)
        .send({ cancelReason: "Reagendamento" });
      expect(cancelled.status).toBe(200);
      expect(cancelled.body.session.status).toBe("cancelada");
    });

    it("permite técnico concluir somente sessão própria", async () => {
      const adminPassword = "admin123456";
      const tecnicoApassword = "techA123456";
      const tecnicoBpassword = "techB123456";

      const admin = await createUser({
        name: "Admin",
        email: "admin3@agenda.test",
        password: adminPassword,
        role: "administrador",
      });
      const tecnicoA = await createUser({
        name: "Tecnico A",
        email: "tecnicoa@agenda.test",
        password: tecnicoApassword,
        role: "tecnico",
      });
      const tecnicoB = await createUser({
        name: "Tecnico B",
        email: "tecnicob@agenda.test",
        password: tecnicoBpassword,
        role: "tecnico",
      });

      const paciente = await Patient.create({
        fullName: "Paciente Tres",
        birthDate: new Date("2016-03-03"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
        fundingSource: "Particular",
        isActive: true,
      });
      const room = await Room.create({ name: "Sala Sessao", isActive: true });
      const type = await SessionType.create({
        name: "INTENSIVO",
        slug: "intensivo",
        defaultDurationMinutes: 60,
        isDurationFlexible: true,
        allowedModalities: ["individual"],
        isActive: true,
      });

      const adminCookie = await loginAndGetCookie(admin.email, adminPassword);
      const tecnicoACookie = await loginAndGetCookie(tecnicoA.email, tecnicoApassword);
      const tecnicoBCookie = await loginAndGetCookie(tecnicoB.email, tecnicoBpassword);

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send({
          sessionTypeId: type._id.toString(),
          modality: "individual",
          roomId: room._id.toString(),
          startAt: "2026-06-02T14:00:00.000Z",
          durationMinutes: 60,
          patientIds: [paciente._id.toString()],
          professionalIds: [tecnicoA._id.toString()],
        });
      expect(created.status).toBe(201);

      const sessionId = created.body.session._id as string;

      const forbidden = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`)
        .set("Cookie", tecnicoBCookie)
        .send();
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.code).toBe("ForbiddenError");

      const completed = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`)
        .set("Cookie", tecnicoACookie)
        .send();
      expect(completed.status).toBe(200);
      expect(completed.body.session.status).toBe("realizada");
    });

    it("impede concluir sessão cancelada", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id.toString(),
            roomId: room._id.toString(),
            patientIds: [paciente._id.toString()],
            professionalIds: [profissional._id.toString()],
          }),
        );
      const sessionId = created.body.session._id as string;

      await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/cancel`)
        .set("Cookie", adminCookie)
        .send({ cancelReason: "Teste" });

      const response = await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`)
        .set("Cookie", adminCookie)
        .send();
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("cancelada");
    });

    it("retorna 404 para sessão inexistente", async () => {
      const { adminCookie } = await seedAgendaBase();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .patch(`/api/agenda/sessions/${fakeId}/complete`)
        .set("Cookie", adminCookie)
        .send();
      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NotFoundError");
    });
  });
});
