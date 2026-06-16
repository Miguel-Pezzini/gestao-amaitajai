import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  serializePatientRef,
  serializePopulatedNameRef,
  withMongoId,
} from "../db/serialize.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/http-errors.js";
import type { AuthUser } from "../types/express.js";
import { isUuid, normalizeText } from "../validators/agenda/agenda.utils.js";
import { validateEvolutionContent } from "../validators/patient-evolution.validator.js";

const evolutionUserInclude = {
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
} as const;

const evolutionSessionInclude = {
  session: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      sessionType: { select: { id: true, name: true } },
    },
  },
} as const;

type SessionWithParticipants = {
  id: string;
  status: string;
  patients: Array<{ patientId: string }>;
  professionals: Array<{ professionalId: string }>;
};

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function serializeEvolution(
  evolution: {
    id: string;
    sessionId: string;
    patientId: string;
    content: string;
    createdById: string;
    updatedById: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: { id: string; name: string } | null;
    updatedBy?: { id: string; name: string } | null;
    session?: {
      id: string;
      startAt: Date;
      endAt: Date;
      status: string;
      sessionType: { id: string; name: string };
    };
  },
) {
  return {
    ...withMongoId(evolution),
    sessionId: evolution.sessionId,
    patientId: evolution.patientId,
    content: evolution.content,
    createdBy: serializePopulatedNameRef(evolution.createdBy ?? null),
    updatedBy: serializePopulatedNameRef(evolution.updatedBy ?? null),
    session: evolution.session
      ? {
          _id: evolution.session.id,
          startAt: evolution.session.startAt,
          endAt: evolution.session.endAt,
          status: evolution.session.status,
          sessionType: {
            _id: evolution.session.sessionType.id,
            name: evolution.session.sessionType.name,
          },
        }
      : undefined,
  };
}

class PatientEvolutionService {
  private assertCanAccessSession(
    session: SessionWithParticipants,
    currentUser: AuthUser,
    options: { requireWritable?: boolean } = {},
  ): void {
    if (options.requireWritable && session.status === "CANCELADA") {
      throw new ValidationError("Não é possível registrar evolução em sessão cancelada.");
    }

    if (currentUser.role === "TECNICO") {
      const isProfessional = session.professionals.some(
        (row) => row.professionalId === currentUser._id,
      );
      if (!isProfessional) {
        throw new ForbiddenError("Técnico só pode acessar evolução da própria sessão.");
      }
    }
  }

  private async findSessionOrThrow(sessionId: string): Promise<SessionWithParticipants> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });

    if (!session) {
      throw new NotFoundError("Sessão não encontrada.");
    }

    return session;
  }

  private assertPatientInSession(session: SessionWithParticipants, patientId: string): void {
    const isParticipant = session.patients.some((row) => row.patientId === patientId);
    if (!isParticipant) {
      throw new ValidationError("O paciente não participa desta sessão.");
    }
  }

  async listSessionEvolutions(sessionId: string, currentUser: AuthUser) {
    const session = await this.findSessionOrThrow(sessionId);
    this.assertCanAccessSession(session, currentUser);

    const patientIds = session.patients.map((row) => row.patientId);
    if (patientIds.length === 0) {
      return { items: [] };
    }

    const [currentEvolutions, patients] = await Promise.all([
      prisma.patientSessionEvolution.findMany({
        where: { sessionId },
        include: evolutionUserInclude,
      }),
      prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: {
          id: true,
          fullName: true,
          fundingSource: { select: { id: true, name: true } },
        },
      }),
    ]);

    const currentByPatientId = new Map(
      currentEvolutions.map((row) => [row.patientId, serializeEvolution(row)]),
    );

    const items = patients.map((patient) => ({
      patient: serializePatientRef(patient),
      current: currentByPatientId.get(patient.id) ?? null,
    }));

    return { items };
  }

  async upsertSessionEvolution(
    sessionId: string,
    patientId: string,
    payload: Record<string, unknown>,
    currentUser: AuthUser,
  ) {
    if (!isUuid(patientId)) {
      throw new ValidationError("Identificador de paciente inválido.");
    }

    const session = await this.findSessionOrThrow(sessionId);
    this.assertCanAccessSession(session, currentUser, { requireWritable: true });
    this.assertPatientInSession(session, patientId);

    const content = validateEvolutionContent(payload.content);

    const existing = await prisma.patientSessionEvolution.findUnique({
      where: {
        sessionId_patientId: {
          sessionId,
          patientId,
        },
      },
      select: { id: true },
    });

    const evolution = existing
      ? await prisma.patientSessionEvolution.update({
          where: { id: existing.id },
          data: {
            content,
            updatedById: currentUser._id,
          },
          include: evolutionUserInclude,
        })
      : await prisma.patientSessionEvolution.create({
          data: {
            sessionId,
            patientId,
            content,
            createdById: currentUser._id,
            updatedById: currentUser._id,
          },
          include: evolutionUserInclude,
        });

    return { evolution: serializeEvolution(evolution) };
  }

  async listPatientEvolutions(patientId: string, query: Record<string, unknown>) {
    if (!isUuid(patientId)) {
      throw new ValidationError("Identificador de paciente inválido.");
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundError("Paciente não encontrado.");
    }

    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const excludeSessionId = normalizeText(query.excludeSessionId);
    const where: Prisma.PatientSessionEvolutionWhereInput = {
      patientId,
      session: { status: { not: "CANCELADA" } },
      ...(excludeSessionId && isUuid(excludeSessionId)
        ? { sessionId: { not: excludeSessionId } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.patientSessionEvolution.findMany({
        where,
        include: {
          ...evolutionUserInclude,
          ...evolutionSessionInclude,
        },
        orderBy: [{ session: { startAt: "desc" } }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.patientSessionEvolution.count({ where }),
    ]);

    return {
      items: items.map(serializeEvolution),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

export const patientEvolutionService = new PatientEvolutionService();
