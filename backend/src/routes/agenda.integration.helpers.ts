import bcrypt from "bcryptjs";
import request from "supertest";
import { expect } from "vitest";
import app from "../app.js";
import { Patient } from "../models/patient.model.js";
import { Room } from "../models/room.model.js";
import { SessionType } from "../models/session-type.model.js";
import { User, type UserRole } from "../models/user.model.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 4);

export async function createUser(params: {
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
    accountStatus: "ativo",
  });
}

export async function loginAndGetCookie(email: string, password: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  expect(response.status).toBe(200);
  const cookie = response.headers["set-cookie"]?.[0];
  expect(cookie).toBeTruthy();
  return cookie as string;
}

export async function seedAgendaBase() {
  const adminPassword = "admin123456";
  const admin = await createUser({
    name: "Admin",
    email: `admin-${Date.now()}@amaitajai.org.br`,
    password: adminPassword,
    role: "administrador",
  });
  const profissional = await createUser({
    name: "Profissional",
    email: `prof-${Date.now()}@amaitajai.org.br`,
    password: "prof123456",
    role: "tecnico",
  });
  const paciente = await Patient.create({
    fullName: "Paciente Teste",
    birthDate: new Date("2018-01-01"),
    guardianName: "Responsavel",
    phone: "(47) 99999-0001",
    fundingSource: "Municipal",
    isActive: true,
  });
  const room = await Room.create({ name: "Sala Teste", isActive: true });
  const sessionType = await SessionType.create({
    name: "PSICOPED",
    slug: `psicoped-${Date.now()}`,
    defaultDurationMinutes: 30,
    isDurationFlexible: false,
    allowedModalities: ["individual"],
    isActive: true,
  });

  const adminCookie = await loginAndGetCookie(admin.email, adminPassword);

  return { admin, adminPassword, profissional, paciente, room, sessionType, adminCookie };
}

export function buildSessionPayload(params: {
  sessionTypeId: string;
  roomId: string;
  patientIds: string[];
  professionalIds: string[];
  startAt?: string;
  modality?: string;
  durationMinutes?: number;
}) {
  return {
    sessionTypeId: params.sessionTypeId,
    modality: params.modality ?? "individual",
    roomId: params.roomId,
    startAt: params.startAt ?? "2026-06-10T13:00:00.000Z",
    durationMinutes: params.durationMinutes ?? 30,
    patientIds: params.patientIds,
    professionalIds: params.professionalIds,
  };
}
