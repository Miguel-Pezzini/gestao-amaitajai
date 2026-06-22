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

describe("Patient evolutions integration", () => {
  useIntegrationTestDatabase();

  it("exige autenticação para listar evoluções da sessão", async () => {
    const response = await request(app).get(`/api/agenda/sessions/${randomUUID()}/evolutions`);
    expect(response.status).toBe(401);
  });

  it("cria, atualiza e lista evoluções por paciente na sessão", async () => {
    const { adminToken, paciente, profissional, room } = await seedAgendaBase();
    const pacienteB = await createPatient({
      fullName: "Paciente Dupla B",
      birthDate: new Date("2017-05-10"),
      guardianName: "Responsavel B",
      phone: "(47) 99999-0002",
    });
    const profissionalB = await createUser({
      name: "Profissional B",
      email: `prof-b-${Date.now()}@agenda.test`,
      password: "prof123456",
      role: "TECNICO",
    });

    const duplaType = await createSessionType({
      name: "DUPLA TESTE",
      slug: `dupla-${Date.now()}`,
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

    const emptyList = await withAuth(request(app)
      .get(`/api/agenda/sessions/${sessionId}/evolutions`), tecnicoToken);
    expect(emptyList.status).toBe(200);
    expect(emptyList.body.items).toHaveLength(2);
    expect(emptyList.body.items[0].current).toBeNull();

    const created = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), tecnicoToken)
      .send({ content: "  Evolução inicial do paciente A  " });
    expect(created.status).toBe(200);
    expect(created.body.evolution.content).toBe("Evolução inicial do paciente A");
    expect(created.body.evolution.createdBy.name).toBe("Profissional");

    const updated = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), tecnicoToken)
      .send({ content: "Evolução revisada do paciente A" });
    expect(updated.status).toBe(200);
    expect(updated.body.evolution.content).toBe("Evolução revisada do paciente A");

    const listed = await withAuth(request(app)
      .get(`/api/agenda/sessions/${sessionId}/evolutions`), tecnicoToken);
    expect(listed.status).toBe(200);
    const patientA = listed.body.items.find(
      (item: { patient: { _id: string } }) => item.patient._id === paciente._id,
    );
    expect(patientA.current.content).toBe("Evolução revisada do paciente A");
  });

  it("inclui histórico anterior do paciente ao listar evoluções da sessão", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

    const firstSession = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: sessionType._id,
          roomId: room._id,
          patientIds: [paciente._id],
          professionalIds: [profissional._id],
          startAt: "2026-06-01T13:00:00.000Z",
        }),
      );
    const firstSessionId = firstSession.body.session._id as string;

    const secondSession = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: sessionType._id,
          roomId: room._id,
          patientIds: [paciente._id],
          professionalIds: [profissional._id],
          startAt: "2026-06-08T13:00:00.000Z",
        }),
      );
    const secondSessionId = secondSession.body.session._id as string;

    await withAuth(request(app)
      .put(`/api/agenda/sessions/${firstSessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: "Primeira sessão" });

    const listed = await withAuth(request(app)
      .get(`/api/patients/${paciente._id}/evolutions`)
      .query({ excludeSessionId: secondSessionId }), adminToken);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].content).toBe("Primeira sessão");
    expect(listed.body.items[0].session.startAt).toBeTruthy();
  });

  it("inclui no histórico evoluções de outras modalidades do mesmo paciente", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();
    const pacienteGrupo = await createPatient({
      fullName: "Paciente Grupo B",
      birthDate: new Date("2016-08-08"),
      guardianName: "Responsavel Grupo",
      phone: "(47) 99999-0010",
    });
    const profissionalB = await createUser({
      name: "Profissional Grupo B",
      email: `prof-grupo-${Date.now()}@agenda.test`,
      password: "prof123456",
      role: "TECNICO",
    });

    const grupoType = await createSessionType({
      name: "GRUPO TESTE",
      slug: `grupo-${Date.now()}`,
      defaultDurationMinutes: 60,
      allowedModalities: ["GRUPO"],
    });

    const individualSession = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: sessionType._id,
          roomId: room._id,
          patientIds: [paciente._id],
          professionalIds: [profissional._id],
          modality: "INDIVIDUAL",
          startAt: "2026-06-01T10:00:00.000Z",
        }),
      );
    const individualSessionId = individualSession.body.session._id as string;

    const grupoSession = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: grupoType._id,
          roomId: room._id,
          patientIds: [paciente._id, pacienteGrupo._id],
          professionalIds: [profissional._id, profissionalB._id],
          modality: "GRUPO",
          durationMinutes: 60,
          startAt: "2026-06-10T14:00:00.000Z",
        }),
      );
    const grupoSessionId = grupoSession.body.session._id as string;

    await withAuth(request(app)
      .put(`/api/agenda/sessions/${individualSessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: "Atendimento individual anterior" });

    const listed = await withAuth(request(app)
      .get(`/api/patients/${paciente._id}/evolutions`)
      .query({ excludeSessionId: grupoSessionId }), adminToken);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].content).toBe("Atendimento individual anterior");
  });

  it("pagina histórico do paciente e exclui sessão atual quando solicitado", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

    const sessionIds: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const created = await withAuth(request(app)
        .post("/api/agenda/sessions"), adminToken)
        .send(
          buildSessionPayload({
            sessionTypeId: sessionType._id,
            roomId: room._id,
            patientIds: [paciente._id],
            professionalIds: [profissional._id],
            startAt: `2026-06-0${index + 1}T13:00:00.000Z`,
          }),
        );
      const sessionId = created.body.session._id as string;
      sessionIds.push(sessionId);
      await withAuth(request(app)
        .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), adminToken)
        .send({ content: `Evolução ${index + 1}` });
    }

    const currentSessionId = sessionIds[2];
    const pageOne = await withAuth(request(app)
      .get(`/api/patients/${paciente._id}/evolutions`)
      .query({ excludeSessionId: currentSessionId, page: 1, limit: 1 }), adminToken);
    expect(pageOne.status).toBe(200);
    expect(pageOne.body.items).toHaveLength(1);
    expect(pageOne.body.pagination.total).toBe(2);
    expect(pageOne.body.pagination.totalPages).toBe(2);

    const pageTwo = await withAuth(request(app)
      .get(`/api/patients/${paciente._id}/evolutions`)
      .query({ excludeSessionId: currentSessionId, page: 2, limit: 1 }), adminToken);
    expect(pageTwo.status).toBe(200);
    expect(pageTwo.body.items).toHaveLength(1);
    expect(pageTwo.body.items[0]._id).not.toBe(pageOne.body.items[0]._id);
  });

  it("lista histórico paginado do paciente", async () => {
    const { adminToken, paciente, profissional, room, sessionType } = await seedAgendaBase();

    const session = await withAuth(request(app)
      .post("/api/agenda/sessions"), adminToken)
      .send(
        buildSessionPayload({
          sessionTypeId: sessionType._id,
          roomId: room._id,
          patientIds: [paciente._id],
          professionalIds: [profissional._id],
        }),
      );
    const sessionId = session.body.session._id as string;

    await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: "Histórico do paciente" });

    const response = await withAuth(request(app)
      .get(`/api/patients/${paciente._id}/evolutions`), adminToken);
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].content).toBe("Histórico do paciente");
    expect(response.body.pagination.total).toBe(1);
  });

  it("rejeita paciente fora da sessão e conteúdo inválido", async () => {
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
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${outsider._id}`), adminToken)
      .send({ content: "Não deveria salvar" });
    expect(outsiderResponse.status).toBe(400);
    expect(outsiderResponse.body.message).toContain("não participa");

    const invalidContent = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: 123 });
    expect(invalidContent.status).toBe(400);
    expect(invalidContent.body.message).toContain("texto");
  });

  it("impede evolução em sessão cancelada", async () => {
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
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: "Depois do cancelamento" });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("cancelada");
  });

  it("restringe técnico à própria sessão e permite admin em qualquer sessão", async () => {
    const { adminToken, paciente, room, sessionType } = await seedAgendaBase();

    const tecnicoA = await createUser({
      name: "Tecnico A",
      email: `tecnico-a-${Date.now()}@agenda.test`,
      password: "tech123456",
      role: "TECNICO",
    });
    const tecnicoB = await createUser({
      name: "Tecnico B",
      email: `tecnico-b-${Date.now()}@agenda.test`,
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
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), tecnicoBToken)
      .send({ content: "Sem permissão" });
    expect(forbidden.status).toBe(403);

    const allowed = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), tecnicoAToken)
      .send({ content: "Evolução do técnico A" });
    expect(allowed.status).toBe(200);

    const adminEdit = await withAuth(request(app)
      .put(`/api/agenda/sessions/${sessionId}/evolutions/${paciente._id}`), adminToken)
      .send({ content: "Evolução editada pelo admin" });
    expect(adminEdit.status).toBe(200);
    expect(adminEdit.body.evolution.content).toBe("Evolução editada pelo admin");
  });
});
