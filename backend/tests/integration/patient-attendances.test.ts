import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { randomUUID } from "node:crypto";
import {
  buildSessionPayload,
  createPatient,
  createSessionType,
  createUser,
  loginAs, withAuth,
  seedAgendaBase,
} from "./helpers/test-helpers.js";
import { useIntegrationTestDatabase } from "./helpers/integration-db.js";

async function createDuplaSession(adminToken: string, params: {
  sessionTypeId: string;
  roomId: string;
  patientIds: string[];
  professionalIds: string[];
}) {
  const response = await withAuth(request(app)
    .post("/api/agenda/sessions"), adminToken)
    .send(
      buildSessionPayload({
        sessionTypeId: params.sessionTypeId,
        roomId: params.roomId,
        patientIds: params.patientIds,
        professionalIds: params.professionalIds,
        modality: "DUPLA",
        durationMinutes: 30,
      }),
    );
  expect(response.status).toBe(201);
  return response.body.session._id as string;
}

describe("Patient attendances integration", () => {
  useIntegrationTestDatabase();

  it("exige autenticação para listar presença da sessão", async () => {
    const response = await request(app).get(`/api/agenda/sessions/${randomUUID()}/attendance`);
    expect(response.status).toBe(401);
  });

  it("lista presença padrão PRESENTE e atualiza por paciente", async () => {
    const { adminToken, paciente, profissional, room } = await seedAgendaBase();
    const pacienteB = await createPatient({
      fullName: "Paciente Dupla B",
      birthDate: new Date("2017-05-10"),
      guardianName: "Responsavel B",
      phone: "(47) 99999-0002",
    });
    const profissionalB = await createUser({
      name: "Profissional B",
      email: `prof-b-att-${Date.now()}@agenda.test`,
      password: "prof123456",
      role: "TECNICO",
    });

    const duplaType = await createSessionType({
      name: "DUPLA ATT TESTE",
      slug: `dupla-att-${Date.now()}`,
      defaultDurationMinutes: 30,
      allowedModalities: ["DUPLA"],
    });

    const sessionId = await createDuplaSession(adminToken, {
      sessionTypeId: duplaType._id,
      roomId: room._id,
      patientIds: [paciente._id, pacienteB._id],
      professionalIds: [profissional._id, profissionalB._id],
    });

    const tecnicoToken = await loginAs(profissional.email, "prof123456");

    const listed = await withAuth(request(app)
      .get(`/api/agenda/sessions/${sessionId}/attendance`), tecnicoToken);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(2);
    expect(listed.body.items[0].current.status).toBe("PRESENTE");
    expect(listed.body.items[0].current.justification).toBe("");

    const updated = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), tecnicoToken)
      .send({ status: "FALTA" });
    expect(updated.status).toBe(200);
    expect(updated.body.attendance.status).toBe("FALTA");
    expect(updated.body.attendance.justification).toBe("");
    expect(updated.body.attendance.updatedBy.name).toBe("Profissional");

    const justified = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${pacienteB._id}`), tecnicoToken)
      .send({
        status: "FALTA_JUSTIFICADA",
        justification: "  Consulta médica agendada  ",
      });
    expect(justified.status).toBe(200);
    expect(justified.body.attendance.status).toBe("FALTA_JUSTIFICADA");
    expect(justified.body.attendance.justification).toBe("Consulta médica agendada");
  });

  it("rejeita falta justificada sem justificativa e justificativa em outros status", async () => {
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

    const missingJustification = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({ status: "FALTA_JUSTIFICADA", justification: "   " });
    expect(missingJustification.status).toBe(400);
    expect(missingJustification.body.message).toContain("obrigatória");

    const invalidJustification = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({ status: "PRESENTE", justification: "Não deveria aceitar" });
    expect(invalidJustification.status).toBe(400);
    expect(invalidJustification.body.message).toContain("só é permitida");
  });

  it("rejeita paciente fora da sessão e status inválido", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
    const outsider = await createPatient({
      fullName: "Paciente Fora",
      birthDate: new Date("2016-01-01"),
      guardianName: "Responsavel",
      phone: "(47) 99999-0099",
    });

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

    const outsiderResponse = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${outsider._id}`), adminToken)
      .send({ status: "PRESENTE" });
    expect(outsiderResponse.status).toBe(400);
    expect(outsiderResponse.body.message).toContain("não participa");

    const invalidStatus = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({ status: "AUSENTE" });
    expect(invalidStatus.status).toBe(400);
    expect(invalidStatus.body.message).toContain("PRESENTE");
  });

  it("impede presença em sessão cancelada", async () => {
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
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({ status: "FALTA" });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("cancelada");
  });

  it("restringe técnico à própria sessão e permite admin em qualquer sessão", async () => {
    const { adminToken, paciente, room, sessionType } = await seedAgendaBase();

    const tecnicoA = await createUser({
      name: "Tecnico A Att",
      email: `tecnico-a-att-${Date.now()}@agenda.test`,
      password: "tech123456",
      role: "TECNICO",
    });
    const tecnicoB = await createUser({
      name: "Tecnico B Att",
      email: `tecnico-b-att-${Date.now()}@agenda.test`,
      password: "tech123456",
      role: "TECNICO",
    });

    const created = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: sessionType._id,
          roomId: room._id,
          patientIds: [paciente._id],
          professionalIds: [tecnicoA._id],
        }),
      );
    const sessionId = created.body.session._id as string;

    const tecnicoAToken = await loginAs(tecnicoA.email, "tech123456");
    const tecnicoBToken = await loginAs(tecnicoB.email, "tech123456");

    const forbidden = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), tecnicoBToken)
      .send({ status: "FALTA" });
    expect(forbidden.status).toBe(403);

    const allowed = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), tecnicoAToken)
      .send({ status: "FALTA" });
    expect(allowed.status).toBe(200);

    const adminEdit = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({ status: "PRESENTE" });
    expect(adminEdit.status).toBe(200);
    expect(adminEdit.body.attendance.status).toBe("PRESENTE");
  });

  it("bloqueia conclusão da sessão com falta justificada sem justificativa", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
    const { prisma } = await import("../../src/db/prisma.js");

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

    await prisma.sessionPatient.update({
      where: {
        sessionId_patientId: {
          sessionId,
          patientId: paciente._id,
        },
      },
      data: {
        attendanceStatus: "FALTA_JUSTIFICADA",
        attendanceJustification: "",
      },
    });

    const blocked = await withAuth(request(app)
      .patch(`/api/agenda/sessions/${sessionId}/complete`), adminToken);
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toContain("justificativa");

    await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/attendance/${paciente._id}`), adminToken)
      .send({
        status: "FALTA_JUSTIFICADA",
        justification: "Atestado médico",
      });

    const completed = await withAuth(request(app)
      .patch(`/api/agenda/sessions/${sessionId}/complete`), adminToken);
    expect(completed.status).toBe(200);
    expect(completed.body.session.status).toBe("REALIZADA");
  });

  it("permite concluir sessão com presença padrão PRESENTE", async () => {
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

    const completed = await withAuth(request(app)
      .patch(`/api/agenda/sessions/${sessionId}/complete`), adminToken);
    expect(completed.status).toBe(200);
    expect(completed.body.session.status).toBe("REALIZADA");
  });
});
