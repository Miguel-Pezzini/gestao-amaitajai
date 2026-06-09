import bcrypt from "bcryptjs";
import request from "supertest";
import { expect } from "vitest";
import app from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import { prisma } from "../../../src/db/prisma.js";
import { withMongoId } from "../../../src/db/serialize.js";
import type { UserRole } from "../../../src/domain/agenda.js";

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(params.password, env.bcryptSaltRounds);
  const user = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      passwordHash,
      role: params.role,
      accountStatus: "ATIVO",
    },
  });
  return withMongoId(user);
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
    email: `admin-${Date.now()}@agenda.test`,
    password: adminPassword,
    role: "ADMINISTRADOR",
  });
  const profissional = await createUser({
    name: "Profissional",
    email: `prof-${Date.now()}@agenda.test`,
    password: "prof123456",
    role: "TECNICO",
  });
  const paciente = withMongoId(
    await prisma.patient.create({
      data: {
        fullName: "Paciente Teste",
        birthDate: new Date("2018-01-01"),
        guardianName: "Responsavel",
        phone: "(47) 99999-0001",
        fundingSource: "MUNICIPAL",
        isActive: true,
      },
    }),
  );
  const room = withMongoId(
    await prisma.room.create({
      data: { name: "Sala Teste", isActive: true },
    }),
  );
  const sessionType = withMongoId(
    await prisma.sessionType.create({
      data: {
        name: "PSICOPED",
        slug: `psicoped-${Date.now()}`,
        defaultDurationMinutes: 30,
        isDurationFlexible: false,
        allowedModalities: ["INDIVIDUAL"],
        isActive: true,
      },
    }),
  );

  const adminCookie = await loginAndGetCookie(admin.email, adminPassword);

  return { admin, adminPassword, profissional, paciente, room, sessionType, adminCookie };
}

export async function createPatient(data: {
  fullName: string;
  birthDate: Date;
  guardianName: string;
  phone: string;
  fundingSource: "MUNICIPAL" | "ESTADUAL" | "PARTICULAR";
  isActive?: boolean;
}) {
  return withMongoId(
    await prisma.patient.create({
      data: { isActive: true, ...data },
    }),
  );
}

export async function createRoom(data: { name: string; isActive?: boolean }) {
  return withMongoId(
    await prisma.room.create({
      data: { isActive: true, ...data },
    }),
  );
}

export async function createProtocolType(data: { name: string; isActive?: boolean }) {
  return withMongoId(
    await prisma.protocolType.create({
      data: { isActive: true, ...data },
    }),
  );
}

export async function createSessionType(data: {
  name: string;
  slug: string;
  defaultDurationMinutes: number;
  isDurationFlexible?: boolean;
  allowedModalities: Array<"INDIVIDUAL" | "DUPLA" | "GRUPO">;
  isActive?: boolean;
}) {
  return withMongoId(
    await prisma.sessionType.create({
      data: {
        isDurationFlexible: false,
        isActive: true,
        ...data,
      },
    }),
  );
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
    modality: params.modality ?? "INDIVIDUAL",
    roomId: params.roomId,
    startAt: params.startAt ?? "2026-06-10T13:00:00.000Z",
    durationMinutes: params.durationMinutes ?? 30,
    patientIds: params.patientIds,
    professionalIds: params.professionalIds,
  };
}

export function buildRecurringSessionPayload(params: {
  sessionTypeId: string;
  roomId: string;
  patientIds: string[];
  professionalIds: string[];
  startAt?: string;
  modality?: string;
  durationMinutes?: number;
  weekdays?: number[];
  endsAt?: string;
}) {
  const startAt = params.startAt ?? "2026-06-02T13:00:00.000Z";
  return {
    ...buildSessionPayload({ ...params, startAt }),
    recurrence: {
      enabled: true,
      weekdays: params.weekdays ?? [1, 3],
      endsAt: params.endsAt ?? "2026-06-30",
    },
  };
}
