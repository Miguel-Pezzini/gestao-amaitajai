import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../app.js";
import { Patient } from "../models/patient.model.js";
import { Room } from "../models/room.model.js";
import { SessionType } from "../models/session-type.model.js";
import { User, type UserRole } from "../models/user.model.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 4);

async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  return User.create({
    name: params.name,
    email: params.email,
    passwordHash,
    role: params.role,
    isActive: true,
  });
}

async function loginAndGetCookie(email: string, password: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  const cookie = response.headers["set-cookie"]?.[0];
  expect(cookie).toBeTruthy();
  return cookie as string;
}

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
      .send({ name: "Sala T1", code: "T1" });
    expect(forbidden.status).toBe(403);

    const created = await request(app)
      .post("/api/agenda/rooms")
      .set("Cookie", adminCookie)
      .send({ name: "Sala A1", code: "A1" });
    expect(created.status).toBe(201);
    expect(created.body.room.name).toBe("Sala A1");
  });

  it("impede conflito de sala na criação de sessão", async () => {
    const adminPassword = "admin123456";
    const profissionalPassword = "tech123456";

    const admin = await createUser({
      name: "Admin",
      email: "admin2@agenda.test",
      password: adminPassword,
      role: "administrador",
    });
    const profissional = await createUser({
      name: "Profissional",
      email: "prof@agenda.test",
      password: profissionalPassword,
      role: "tecnico",
    });

    const paciente1 = await Patient.create({
      fullName: "Paciente Um",
      birthDate: new Date("2018-01-01"),
      guardianName: "Responsavel 1",
      phone: "(47) 99999-0001",
      fundingSource: "Municipal",
      isActive: true,
    });
    const paciente2 = await Patient.create({
      fullName: "Paciente Dois",
      birthDate: new Date("2017-02-02"),
      guardianName: "Responsavel 2",
      phone: "(47) 99999-0002",
      fundingSource: "Estadual",
      isActive: true,
    });
    const room = await Room.create({ name: "Sala Conflito", code: "SC", isActive: true });
    const type = await SessionType.create({
      name: "PSICOPED",
      slug: "psicoped",
      defaultDurationMinutes: 30,
      isDurationFlexible: false,
      allowedModalities: ["individual"],
      isActive: true,
    });

    const adminCookie = await loginAndGetCookie(admin.email, adminPassword);

    const first = await request(app)
      .post("/api/agenda/sessions")
      .set("Cookie", adminCookie)
      .send({
        sessionTypeId: type._id.toString(),
        modality: "individual",
        roomId: room._id.toString(),
        startAt: "2026-06-01T13:00:00.000Z",
        durationMinutes: 30,
        patientIds: [paciente1._id.toString()],
        professionalIds: [profissional._id.toString()],
      });
    expect(first.status).toBe(201);

    const conflicting = await request(app)
      .post("/api/agenda/sessions")
      .set("Cookie", adminCookie)
      .send({
        sessionTypeId: type._id.toString(),
        modality: "individual",
        roomId: room._id.toString(),
        startAt: "2026-06-01T13:15:00.000Z",
        durationMinutes: 30,
        patientIds: [paciente2._id.toString()],
        professionalIds: [profissional._id.toString()],
      });

    expect(conflicting.status).toBe(409);
    expect(conflicting.body.message).toContain("Conflito de agenda");
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
    const room = await Room.create({ name: "Sala Sessao", code: "SS", isActive: true });
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

    const completed = await request(app)
      .patch(`/api/agenda/sessions/${sessionId}/complete`)
      .set("Cookie", tecnicoACookie)
      .send();
    expect(completed.status).toBe(200);
    expect(completed.body.session.status).toBe("realizada");
  });
});
