import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/db/prisma.js";
import { buildPatientDeactivatedCancelReason } from "../../src/domain/agenda.js";
import {
  buildRecurringSessionPayload,
  buildSessionPayload,
  createPatient,
  createSessionType,
  createUser,
  loginAndGetCookie,
  seedAgendaBase,
} from "./helpers/test-helpers.js";
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

  describe("inativação e sessões futuras", () => {
    it("cancela sessões individuais na inativação", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const sessionType = await createSessionType({
        name: "PSICOPED",
        slug: `psicoped-individual-${Date.now()}`,
        defaultDurationMinutes: 30,
        allowedModalities: ["individual"],
      });

      await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-07-10T13:00:00.000Z",
          }),
        );

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(1);
      expect(deactivated.body.sessionsReplaced).toBe(0);

      const sessions = await prisma.session.findMany({
        where: { patients: { some: { patientId: paciente._id } } },
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.status).toBe("cancelada");
      expect(sessions[0]?.cancelReason).toBe(
        buildPatientDeactivatedCancelReason(paciente.fullName),
      );
    });

    it("exige substituição em sessão em grupo com outros participantes", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Grupo 2",
        birthDate: new Date("2017-02-02"),
        guardianName: "Responsavel 2",
        phone: "(47) 99999-0002",
        fundingSource: "Estadual",
      });
      const paciente3 = await createPatient({
        fullName: "Paciente Grupo 3",
        birthDate: new Date("2017-03-03"),
        guardianName: "Responsavel 3",
        phone: "(47) 99999-0003",
        fundingSource: "Estadual",
      });
      const profissional2 = await createUser({
        name: "Prof Grupo 2",
        email: `prof-grupo-2-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const groupType = await createSessionType({
        name: "Grupo Terapêutico",
        slug: `grupo-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["grupo"],
      });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id, paciente3._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "grupo",
            durationMinutes: 60,
            startAt: "2026-07-10T13:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;
      const substituto = await createPatient({
        fullName: "Paciente Grupo Substituto",
        birthDate: new Date("2017-06-06"),
        guardianName: "Responsavel 6",
        phone: "(47) 99999-0006",
        fundingSource: "Estadual",
      });

      const impact = await request(app)
        .get(`/api/patients/${paciente._id}/deactivation-impact`)
        .set("Cookie", adminCookie);
      expect(impact.status).toBe(200);
      expect(impact.body.requiresReplacement).toBe(true);
      expect(impact.body.replacements).toHaveLength(1);
      expect(impact.body.replacements[0]?.sessionId).toBe(sessionId);

      const blocked = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(blocked.status).toBe(400);

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
          replacements: [{ sessionId, replacementPatientId: substituto._id }],
        });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(0);
      expect(deactivated.body.sessionsReplaced).toBe(1);

      const session = await prisma.session.findUniqueOrThrow({
        where: { id: sessionId },
        include: { patients: true },
      });
      expect(session.status).toBe("agendada");
      expect(session.patients.map((row) => row.patientId).sort()).toEqual(
        [paciente2._id, paciente3._id, substituto._id].sort(),
      );
    });

    it("substitui paciente em grupo mesmo quando fica abaixo do mínimo configurado", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Dupla Grupo",
        birthDate: new Date("2017-04-04"),
        guardianName: "Responsavel 4",
        phone: "(47) 99999-0004",
        fundingSource: "Estadual",
      });
      const profissional2 = await createUser({
        name: "Prof Grupo Min",
        email: `prof-grupo-min-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const groupType = await createSessionType({
        name: "Grupo Mínimo 2",
        slug: `grupo-min-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["grupo"],
      });

      await request(app)
        .patch("/api/agenda/session-modalities/grupo")
        .set("Cookie", adminCookie)
        .send({
          minPatients: 2,
          maxPatients: 15,
          minProfessionals: 2,
          maxProfessionals: 4,
          isActive: true,
        });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "grupo",
            durationMinutes: 60,
            startAt: "2026-07-10T13:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;
      const substituto = await createPatient({
        fullName: "Paciente Grupo Min Substituto",
        birthDate: new Date("2017-07-07"),
        guardianName: "Responsavel 7",
        phone: "(47) 99999-0007",
        fundingSource: "Estadual",
      });

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
          replacements: [{ sessionId, replacementPatientId: substituto._id }],
        });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(0);
      expect(deactivated.body.sessionsReplaced).toBe(1);

      const session = await prisma.session.findUniqueOrThrow({
        where: { id: sessionId },
        include: { patients: true },
      });
      expect(session.status).toBe("agendada");
      expect(session.patients.map((row) => row.patientId).sort()).toEqual(
        [paciente2._id, substituto._id].sort(),
      );
    });

    it("substitui paciente em sessão em dupla sem cancelar a sessão", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Dupla 2",
        birthDate: new Date("2017-05-05"),
        guardianName: "Responsavel 5",
        phone: "(47) 99999-0005",
        fundingSource: "Estadual",
      });
      const profissional2 = await createUser({
        name: "Prof Dupla 2",
        email: `prof-dupla-2-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const duplaType = await createSessionType({
        name: "FONO Dupla",
        slug: `dupla-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["dupla"],
      });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: duplaType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "dupla",
            durationMinutes: 60,
            startAt: "2026-07-10T13:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;
      const substituto = await createPatient({
        fullName: "Paciente Dupla Substituto",
        birthDate: new Date("2017-08-08"),
        guardianName: "Responsavel 8",
        phone: "(47) 99999-0008",
        fundingSource: "Estadual",
      });

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
          replacements: [{ sessionId, replacementPatientId: substituto._id }],
        });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(0);
      expect(deactivated.body.sessionsReplaced).toBe(1);

      const session = await prisma.session.findUniqueOrThrow({
        where: { id: sessionId },
        include: { patients: true },
      });
      expect(session.status).toBe("agendada");
      expect(session.patients.map((row) => row.patientId).sort()).toEqual(
        [paciente2._id, substituto._id].sort(),
      );
    });

    it("substitui paciente em série recorrente com uma única troca", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Série 2",
        birthDate: new Date("2017-09-09"),
        guardianName: "Responsavel 9",
        phone: "(47) 99999-0009",
        fundingSource: "Estadual",
      });
      const profissional2 = await createUser({
        name: "Prof Série 2",
        email: `prof-serie-2-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const substituto = await createPatient({
        fullName: "Paciente Série Substituto",
        birthDate: new Date("2017-10-10"),
        guardianName: "Responsavel 10",
        phone: "(47) 99999-0010",
        fundingSource: "Estadual",
      });
      const duplaType = await createSessionType({
        name: "Dupla Recorrente",
        slug: `dupla-recorrente-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["dupla"],
      });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: duplaType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "dupla",
            durationMinutes: 60,
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );
      expect(created.status).toBe(201);
      const seriesId = created.body.series._id as string;

      const impact = await request(app)
        .get(`/api/patients/${paciente._id}/deactivation-impact`)
        .set("Cookie", adminCookie);
      expect(impact.status).toBe(200);
      expect(impact.body.replacements).toHaveLength(1);
      expect(impact.body.replacements[0]?.type).toBe("series");
      expect(impact.body.replacements[0]?.seriesId).toBe(seriesId);
      expect(impact.body.replacements[0]?.sessionCount).toBeGreaterThan(1);

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
          replacements: [{ seriesId, replacementPatientId: substituto._id }],
        });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsReplaced).toBeGreaterThan(1);

      const sessions = await prisma.session.findMany({
        where: { seriesId, status: "agendada" },
        include: { patients: true },
      });
      expect(sessions.length).toBeGreaterThan(1);
      for (const session of sessions) {
        expect(session.patients.map((row) => row.patientId).sort()).toEqual(
          [paciente2._id, substituto._id].sort(),
        );
      }

      const seriesPatients = await prisma.sessionSeriesPatient.findMany({
        where: { seriesId },
      });
      expect(seriesPatients.map((row) => row.patientId).sort()).toEqual(
        [paciente2._id, substituto._id].sort(),
      );
    });

    it("cancela sessão em grupo quando o paciente é o único participante", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const profissional2 = await createUser({
        name: "Prof Grupo Único",
        email: `prof-grupo-unico-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const groupType = await createSessionType({
        name: "Grupo Único",
        slug: `grupo-unico-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["grupo"],
      });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: groupType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "grupo",
            durationMinutes: 60,
            startAt: "2026-07-10T13:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(1);
      expect(deactivated.body.sessionsReplaced).toBe(0);

      const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
      expect(session.status).toBe("cancelada");
      expect(session.cancelReason).toBe(buildPatientDeactivatedCancelReason(paciente.fullName));
    });

    it("cancela sessão agendada mesmo quando o horário de início já passou", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-09T08:00:00.000Z",
          }),
        );
      expect(created.status).toBe(201);
      const sessionId = created.body.session._id as string;

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(1);

      const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
      expect(session.status).toBe("cancelada");
      expect(session.cancelReason).toBe(buildPatientDeactivatedCancelReason(paciente.fullName));
    });

    it("não altera sessões já realizadas", async () => {
      const { adminCookie, paciente, profissional, room, sessionType } = await seedAgendaBase();

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: "2026-06-10T13:00:00.000Z",
          }),
        );
      const sessionId = created.body.session._id as string;

      await request(app)
        .patch(`/api/agenda/sessions/${sessionId}/complete`)
        .set("Cookie", adminCookie)
        .send();

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({ isActive: false });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(0);
      expect(deactivated.body.sessionsReplaced).toBe(0);

      const session = await prisma.session.findUniqueOrThrow({
        where: { id: sessionId },
        include: { patients: true },
      });
      expect(session.status).toBe("realizada");
      expect(session.patients.map((row) => row.patientId)).toContain(paciente._id);
    });

    it("mantém paciente em sessão realizada de série ao substituir ocorrências futuras", async () => {
      const { adminCookie, paciente, profissional, room } = await seedAgendaBase();
      const paciente2 = await createPatient({
        fullName: "Paciente Série Realizada 2",
        birthDate: new Date("2017-11-11"),
        guardianName: "Responsavel 11",
        phone: "(47) 99999-0011",
        fundingSource: "Estadual",
      });
      const profissional2 = await createUser({
        name: "Prof Série Realizada 2",
        email: `prof-serie-realizada-2-${Date.now()}@patients.test`,
        password: "prof123456",
        role: "tecnico",
      });
      const substituto = await createPatient({
        fullName: "Paciente Série Realizada Substituto",
        birthDate: new Date("2017-12-12"),
        guardianName: "Responsavel 12",
        phone: "(47) 99999-0012",
        fundingSource: "Estadual",
      });
      const duplaType = await createSessionType({
        name: "Dupla Série Realizada",
        slug: `dupla-serie-realizada-${Date.now()}`,
        defaultDurationMinutes: 60,
        allowedModalities: ["dupla"],
      });

      const created = await request(app)
        .post("/api/agenda/sessions")
        .set("Cookie", adminCookie)
        .send(
          buildRecurringSessionPayload({
            sessionTypeId: duplaType._id,
            roomId: room._id,
            patientIds: [paciente._id, paciente2._id],
            professionalIds: [profissional._id, profissional2._id],
            modality: "dupla",
            durationMinutes: 60,
            startAt: "2026-06-02T13:00:00.000Z",
            weekdays: [1, 3],
            endsAt: "2026-06-30",
          }),
        );
      expect(created.status).toBe(201);
      const seriesId = created.body.series._id as string;

      const firstSession = await prisma.session.findFirstOrThrow({
        where: { seriesId },
        orderBy: { startAt: "asc" },
      });

      await request(app)
        .patch(`/api/agenda/sessions/${firstSession.id}/complete`)
        .set("Cookie", adminCookie)
        .send();

      const deactivated = await request(app)
        .patch(`/api/patients/${paciente._id}/status`)
        .set("Cookie", adminCookie)
        .send({
          isActive: false,
          replacements: [{ seriesId, replacementPatientId: substituto._id }],
        });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.sessionsCancelled).toBe(0);
      expect(deactivated.body.sessionsReplaced).toBeGreaterThan(0);

      const completedSession = await prisma.session.findUniqueOrThrow({
        where: { id: firstSession.id },
        include: { patients: true },
      });
      expect(completedSession.status).toBe("realizada");
      expect(completedSession.patients.map((row) => row.patientId).sort()).toEqual(
        [paciente._id, paciente2._id].sort(),
      );

      const pendingSessions = await prisma.session.findMany({
        where: { seriesId, status: "agendada" },
        include: { patients: true },
      });
      expect(pendingSessions.length).toBeGreaterThan(0);
      for (const session of pendingSessions) {
        expect(session.patients.map((row) => row.patientId).sort()).toEqual(
          [paciente2._id, substituto._id].sort(),
        );
      }
    });
  });
});
