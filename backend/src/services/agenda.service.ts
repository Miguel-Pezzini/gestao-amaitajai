import { Prisma, type SessionStatus as PrismaSessionStatus } from "@prisma/client";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/http-errors.js";
import { prisma } from "../db/prisma.js";
import { isPrismaUniqueViolation } from "../db/errors.js";
import {
  serializeSessionForList,
  serializeSessionPlain,
  serializeSessionRecord,
  withMongoId,
  withMongoIdList,
} from "../db/serialize.js";
import {
  SESSION_MODALITIES,
  USER_ROLES,
  type SessionModality,
  type UserRole,
} from "../domain/agenda.js";
import {
  duplicateRoomMessage,
  containsInsensitive,
  normalizeText,
  parseDate,
  parseLimit,
  isUuid,
} from "../validators/agenda/agenda.utils.js";
import {
  validateCreateRoom,
  validateRoomId,
  validateUpdateRoom,
} from "../validators/agenda/room.validator.js";
import {
  validateCreateSessionType,
  validateSessionTypeId,
  validateUpdateSessionType,
} from "../validators/agenda/session-type.validator.js";
import { validateSessionModalitySettingUpdate } from "../validators/agenda/session-modality-setting.validator.js";
import {
  AVAILABILITY_MIN_SEARCH_LENGTH,
  hasAvailabilitySearchTerm,
  parseAvailabilityLookupQuery,
} from "../validators/agenda/availability.validator.js";
import {
  normalizeSessionInput,
  type SessionPayload,
  validateCancelSession,
  validateCompleteSession,
  validateSession,
  validateSessionModality,
  validateUpdateSession,
} from "../validators/agenda/session.validator.js";
import {
  buildSessionOverlapWhere,
  indexConflictsByParticipantId,
  mapOverlapSessionToConflictShape,
} from "./agenda-availability.helpers.js";

type AuthenticatedUser = {
  _id: string;
  role: UserRole;
};

type SessionValidationLimits = {
  minPatients: number;
  maxPatients: number;
  minProfessionals: number;
  maxProfessionals: number;
};

const DEFAULT_SESSION_MODALITY_SETTINGS: Record<SessionModality, SessionValidationLimits> = {
  individual: { minPatients: 1, maxPatients: 1, minProfessionals: 1, maxProfessionals: 1 },
  dupla: { minPatients: 2, maxPatients: 2, minProfessionals: 2, maxProfessionals: 2 },
  grupo: { minPatients: 1, maxPatients: 15, minProfessionals: 2, maxProfessionals: 4 },
};

const SESSION_FORMAT_LABELS: Record<SessionModality, string> = {
  individual: "Individual",
  dupla: "Dupla",
  grupo: "Grupo",
};

const SESSION_LIST_INCLUDE = {
  sessionType: { select: { id: true, name: true, slug: true } },
  room: { select: { id: true, name: true } },
  patients: {
    include: { patient: { select: { id: true, fullName: true, fundingSource: true } } },
  },
  professionals: {
    include: { professional: { select: { id: true, name: true, email: true, role: true } } },
  },
} satisfies Prisma.SessionInclude;

const OVERLAP_SESSION_SELECT = {
  id: true,
  startAt: true,
  endAt: true,
  modality: true,
  sessionType: { select: { name: true } },
  room: { select: { name: true } },
  professionals: { select: { professionalId: true } },
  patients: { select: { patientId: true } },
} satisfies Prisma.SessionSelect;

export class AgendaService {
  async searchPatients(query: Record<string, unknown>) {
    const availability = parseAvailabilityLookupQuery(query);
    if (availability) {
      return this.listPatientsAvailability(availability);
    }

    const term = normalizeText(query.q);
    if (!term) {
      return { items: [] };
    }

    const limit = parseLimit(query.limit);
    const rows = await prisma.patient.findMany({
      where: {
        isActive: true,
        OR: [{ fullName: containsInsensitive(term) }, { guardianName: containsInsensitive(term) }],
      },
      orderBy: { fullName: "asc" },
      take: limit,
      select: { id: true, fullName: true, guardianName: true, fundingSource: true },
    });

    return { items: withMongoIdList(rows) };
  }

  async searchProfessionals(query: Record<string, unknown>) {
    const availability = parseAvailabilityLookupQuery(query);
    if (availability) {
      return this.listProfessionalsAvailability(availability);
    }

    const term = normalizeText(query.q);
    if (!term) {
      return { items: [] };
    }

    const limit = parseLimit(query.limit);
    const rows = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [...USER_ROLES] },
        OR: [{ name: containsInsensitive(term) }, { email: containsInsensitive(term) }],
      },
      orderBy: { name: "asc" },
      take: limit,
      select: { id: true, name: true, email: true, role: true },
    });

    return { items: withMongoIdList(rows) };
  }

  private async listProfessionalsAvailability(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
  ) {
    if (input.summaryOnly) {
      return this.getProfessionalsAvailabilitySummary(input);
    }

    const userWhere: Prisma.UserWhereInput = {
      isActive: true,
      role: { in: [...USER_ROLES] },
    };
    if (input.q) {
      userWhere.OR = [
        { name: containsInsensitive(input.q) },
        { email: containsInsensitive(input.q) },
      ];
    }

    const listLimit = input.q ? input.limit : 200;
    const professionals = await prisma.user.findMany({
      where: userWhere,
      orderBy: { name: "asc" },
      take: listLimit,
      select: { id: true, name: true, email: true, role: true },
    });

    const professionalIds = professionals.map((item) => item.id);
    const overlapWhere = buildSessionOverlapWhere({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const overlappingSessions =
      professionalIds.length === 0
        ? []
        : await prisma.session.findMany({
            where: {
              ...overlapWhere,
              professionals: { some: { professionalId: { in: professionalIds } } },
            },
            select: OVERLAP_SESSION_SELECT,
          });

    const conflictsById = indexConflictsByParticipantId(
      overlappingSessions.map(mapOverlapSessionToConflictShape),
      "professionalIds",
    );

    const items = professionals.map((professional) => {
      const conflictSession = conflictsById.get(professional.id) ?? null;
      return {
        ...withMongoId(professional),
        isAvailable: conflictSession === null,
        conflictSession,
      };
    });

    const filteredItems = input.availableOnly
      ? items.filter((item) => item.isAvailable)
      : items;

    return {
      items: filteredItems,
      meta: this.buildAvailabilityMeta(input, {
        totalCount: items.length,
        availableCount: items.filter((item) => item.isAvailable).length,
      }),
    };
  }

  private async getProfessionalsAvailabilitySummary(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
  ) {
    const baseFilter: Prisma.UserWhereInput = {
      isActive: true,
      role: { in: [...USER_ROLES] },
    };
    const overlapWhere = buildSessionOverlapWhere({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const [totalCount, busyLinks] = await Promise.all([
      prisma.user.count({ where: baseFilter }),
      prisma.sessionProfessional.findMany({
        where: { session: overlapWhere },
        distinct: ["professionalId"],
        select: { professionalId: true },
      }),
    ]);

    const busyProfessionalIds = busyLinks.map((row) => row.professionalId);
    const availableCount = await prisma.user.count({
      where: {
        ...baseFilter,
        id: { notIn: busyProfessionalIds },
      },
    });

    return {
      items: [],
      meta: this.buildAvailabilityMeta(input, { totalCount, availableCount }),
    };
  }

  private async listPatientsAvailability(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
  ) {
    if (input.summaryOnly) {
      return this.getPatientsAvailabilitySummary(input);
    }

    if (!hasAvailabilitySearchTerm(input.q)) {
      return {
        items: [],
        meta: this.buildAvailabilityMeta(input, { totalCount: 0, availableCount: 0 }, true),
      };
    }

    const patientWhere: Prisma.PatientWhereInput = {
      isActive: true,
      OR: [
        { fullName: containsInsensitive(input.q) },
        { guardianName: containsInsensitive(input.q) },
      ],
    };

    const patients = await prisma.patient.findMany({
      where: patientWhere,
      orderBy: { fullName: "asc" },
      take: input.limit,
      select: { id: true, fullName: true, guardianName: true, fundingSource: true },
    });

    const patientIds = patients.map((item) => item.id);
    const overlapWhere = buildSessionOverlapWhere({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const overlappingSessions =
      patientIds.length === 0
        ? []
        : await prisma.session.findMany({
            where: {
              ...overlapWhere,
              patients: { some: { patientId: { in: patientIds } } },
            },
            select: OVERLAP_SESSION_SELECT,
          });

    const conflictsById = indexConflictsByParticipantId(
      overlappingSessions.map(mapOverlapSessionToConflictShape),
      "patientIds",
    );

    const items = patients.map((patient) => {
      const conflictSession = conflictsById.get(patient.id) ?? null;
      return {
        ...withMongoId(patient),
        isAvailable: conflictSession === null,
        conflictSession,
      };
    });

    const filteredItems = input.availableOnly ? items.filter((item) => item.isAvailable) : items;

    return {
      items: filteredItems,
      meta: this.buildAvailabilityMeta(input, {
        totalCount: items.length,
        availableCount: items.filter((item) => item.isAvailable).length,
      }),
    };
  }

  private async getPatientsAvailabilitySummary(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
  ) {
    const baseFilter: Prisma.PatientWhereInput = { isActive: true };
    const overlapWhere = buildSessionOverlapWhere({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const [totalCount, busyLinks] = await Promise.all([
      prisma.patient.count({ where: baseFilter }),
      prisma.sessionPatient.findMany({
        where: { session: overlapWhere },
        distinct: ["patientId"],
        select: { patientId: true },
      }),
    ]);

    const busyPatientIds = busyLinks.map((row) => row.patientId);
    const availableCount = await prisma.patient.count({
      where: {
        ...baseFilter,
        id: { notIn: busyPatientIds },
      },
    });

    return {
      items: [],
      meta: this.buildAvailabilityMeta(input, { totalCount, availableCount }),
    };
  }

  private buildAvailabilityMeta(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
    counts: { totalCount: number; availableCount: number },
    requiresSearch = false,
  ) {
    return {
      startAt: input.startAt.toISOString(),
      endAt: input.endAt.toISOString(),
      totalCount: counts.totalCount,
      availableCount: counts.availableCount,
      requiresSearch,
      minSearchLength: AVAILABILITY_MIN_SEARCH_LENGTH,
    };
  }

  async listRooms() {
    const items = await prisma.room.findMany({ orderBy: { name: "asc" } });
    return { items: withMongoIdList(items) };
  }

  async createRoom(payload: { name?: unknown }) {
    const { name } = validateCreateRoom(payload);
    return this.persistRoomCreate(name);
  }

  async updateRoom(roomId: string, payload: { name?: unknown }) {
    const updates = validateUpdateRoom(roomId, payload);
    await this.findRoomOrThrow(roomId);
    return this.persistRoomUpdate(roomId, updates.name);
  }

  async updateRoomStatus(roomId: string, isActive: boolean) {
    validateRoomId(roomId);
    try {
      const room = await prisma.room.update({
        where: { id: roomId },
        data: { isActive },
      });
      return { room: withMongoId(room) };
    } catch {
      throw new NotFoundError("Sala não encontrada.");
    }
  }

  async listSessionTypes() {
    const items = await prisma.sessionType.findMany({ orderBy: { name: "asc" } });
    return { items: withMongoIdList(items) };
  }

  async createSessionType(payload: {
    name?: unknown;
    slug?: unknown;
    defaultDurationMinutes?: unknown;
    isDurationFlexible?: unknown;
    allowedModalities?: unknown;
  }) {
    const input = validateCreateSessionType(payload);
    const sessionType = await prisma.sessionType.create({ data: input });
    return { sessionType: withMongoId(sessionType) };
  }

  async updateSessionType(
    sessionTypeId: string,
    payload: {
      name?: unknown;
      slug?: unknown;
      defaultDurationMinutes?: unknown;
      isDurationFlexible?: unknown;
      allowedModalities?: unknown;
    },
  ) {
    const existing = await this.findSessionTypeOrThrow(sessionTypeId);
    const updates = validateUpdateSessionType(sessionTypeId, payload, existing);
    const sessionType = await prisma.sessionType.update({
      where: { id: sessionTypeId },
      data: updates,
    });
    return { sessionType: withMongoId(sessionType) };
  }

  async updateSessionTypeStatus(sessionTypeId: string, isActive: boolean) {
    validateSessionTypeId(sessionTypeId);
    try {
      const sessionType = await prisma.sessionType.update({
        where: { id: sessionTypeId },
        data: { isActive },
      });
      return { sessionType: withMongoId(sessionType) };
    } catch {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }
  }

  async listSessions(query: Record<string, unknown>, currentUser: AuthenticatedUser) {
    const where = this.buildSessionListWhere(query, currentUser);
    const sessions = await prisma.session.findMany({
      where,
      orderBy: { startAt: "asc" },
      include: SESSION_LIST_INCLUDE,
    });

    return { items: sessions.map(serializeSessionForList) };
  }

  async createSession(payload: SessionPayload, currentUser: AuthenticatedUser) {
    const normalized = normalizeSessionInput(payload);
    validateSession(normalized);
    await this.validateSessionParticipantsByModality(
      normalized.modality,
      normalized.patientIds.length,
      normalized.professionalIds.length,
    );
    const startAt = normalized.startAt as Date;

    const references = await this.loadSessionReferences(normalized);
    validateSessionModality(references.sessionType.allowedModalities, normalized.modality);

    const endAt = this.computeSessionEndAt(startAt, normalized.durationMinutes);
    await this.assertNoSchedulingConflicts({
      startAt,
      endAt,
      roomId: normalized.roomId,
      patientIds: normalized.patientIds,
      professionalIds: normalized.professionalIds,
    });

    const session = await prisma.session.create({
      data: {
        sessionTypeId: normalized.sessionTypeId,
        modality: normalized.modality,
        roomId: normalized.roomId,
        startAt,
        endAt,
        durationMinutes: normalized.durationMinutes,
        status: "agendada",
        notes: normalized.notes,
        createdById: currentUser._id,
        updatedById: currentUser._id,
        patients: {
          create: normalized.patientIds.map((patientId) => ({ patientId })),
        },
        professionals: {
          create: normalized.professionalIds.map((professionalId) => ({ professionalId })),
        },
      },
      include: {
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });

    return { session: serializeSessionPlain(session) };
  }

  async updateSession(
    sessionId: string,
    payload: SessionPayload,
    currentUser: AuthenticatedUser,
  ) {
    const existing = await this.findSessionOrThrow(sessionId);
    validateUpdateSession(sessionId, existing.status);

    const normalized = normalizeSessionInput(payload, {
      sessionTypeId: existing.sessionTypeId,
      modality: existing.modality as SessionModality,
      roomId: existing.roomId,
      startAt: existing.startAt,
      durationMinutes: existing.durationMinutes,
      patientIds: existing.patients.map((row) => row.patientId),
      professionalIds: existing.professionals.map((row) => row.professionalId),
      notes: existing.notes,
    });
    validateSession(normalized);
    await this.validateSessionParticipantsByModality(
      normalized.modality,
      normalized.patientIds.length,
      normalized.professionalIds.length,
    );
    const startAt = normalized.startAt as Date;

    const references = await this.loadSessionReferences(normalized);
    validateSessionModality(references.sessionType.allowedModalities, normalized.modality);

    const endAt = this.computeSessionEndAt(startAt, normalized.durationMinutes);
    await this.assertNoSchedulingConflicts({
      startAt,
      endAt,
      roomId: normalized.roomId,
      patientIds: normalized.patientIds,
      professionalIds: normalized.professionalIds,
      excludeSessionId: sessionId,
    });

    const session = await prisma.$transaction(async (tx) => {
      await tx.sessionPatient.deleteMany({ where: { sessionId } });
      await tx.sessionProfessional.deleteMany({ where: { sessionId } });

      return tx.session.update({
        where: { id: sessionId },
        data: {
          sessionTypeId: normalized.sessionTypeId,
          modality: normalized.modality,
          roomId: normalized.roomId,
          startAt,
          endAt,
          durationMinutes: normalized.durationMinutes,
          notes: normalized.notes,
          updatedById: currentUser._id,
          patients: {
            create: normalized.patientIds.map((patientId) => ({ patientId })),
          },
          professionals: {
            create: normalized.professionalIds.map((professionalId) => ({ professionalId })),
          },
        },
        include: SESSION_LIST_INCLUDE,
      });
    });

    return { session: serializeSessionRecord(session) };
  }

  async cancelSession(
    sessionId: string,
    payload: { cancelReason?: unknown },
    currentUser: AuthenticatedUser,
  ) {
    const { cancelReason } = validateCancelSession(sessionId, payload);

    try {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "cancelada",
          cancelReason,
          cancelledAt: new Date(),
          updatedById: currentUser._id,
        },
        include: {
          patients: { select: { patientId: true } },
          professionals: { select: { professionalId: true } },
        },
      });
      return { session: serializeSessionPlain(session) };
    } catch {
      throw new NotFoundError("Sessão não encontrada.");
    }
  }

  async completeSession(sessionId: string, currentUser: AuthenticatedUser) {
    const existing = await this.findSessionOrThrow(sessionId);
    validateCompleteSession(sessionId, existing.status);
    this.assertTechnicianCanComplete(existing, currentUser);

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "realizada",
        updatedById: currentUser._id,
      },
      include: {
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });

    return { session: serializeSessionPlain(session) };
  }

  async listSessionModalitySettings() {
    await this.ensureSessionModalitySettings();
    const items = await prisma.sessionModalitySetting.findMany({ orderBy: { modality: "asc" } });
    return { items: withMongoIdList(items) };
  }

  async updateSessionModalitySetting(
    modality: string,
    payload: {
      minPatients?: unknown;
      maxPatients?: unknown;
      minProfessionals?: unknown;
      maxProfessionals?: unknown;
      isActive?: unknown;
    },
  ) {
    await this.ensureSessionModalitySettings();
    const input = validateSessionModalitySettingUpdate(modality, payload);
    try {
      const setting = await prisma.sessionModalitySetting.update({
        where: { modality: input.modality },
        data: {
          minPatients: input.minPatients,
          maxPatients: input.maxPatients,
          minProfessionals: input.minProfessionals,
          maxProfessionals: input.maxProfessionals,
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
      return { setting: withMongoId(setting) };
    } catch {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }
  }

  private buildSessionListWhere(
    query: Record<string, unknown>,
    currentUser: AuthenticatedUser,
  ): Prisma.SessionWhereInput {
    const where: Prisma.SessionWhereInput = {};
    const status = normalizeText(query.status);
    if (status && ["agendada", "realizada", "cancelada"].includes(status)) {
      where.status = status as PrismaSessionStatus;
    }

    const startAt = parseDate(query.startAt);
    const endAt = parseDate(query.endAt);
    if (startAt && endAt) {
      where.startAt = { lt: endAt };
      where.endAt = { gt: startAt };
    }

    const professionalId = normalizeText(query.professionalId);
    if (professionalId && isUuid(professionalId) && currentUser.role === "administrador") {
      where.professionals = { some: { professionalId } };
    }

    if (currentUser.role === "tecnico") {
      where.professionals = { some: { professionalId: currentUser._id } };
    }

    return where;
  }

  private computeSessionEndAt(startAt: Date, durationMinutes: number): Date {
    return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  }

  private async persistRoomCreate(name: string) {
    try {
      const room = await prisma.room.create({ data: { name } });
      return { room: withMongoId(room) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError(duplicateRoomMessage(error));
      }
      throw error;
    }
  }

  private async persistRoomUpdate(roomId: string, name?: string) {
    if (!name) {
      const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
      return { room: withMongoId(room) };
    }

    try {
      const room = await prisma.room.update({
        where: { id: roomId },
        data: { name },
      });
      return { room: withMongoId(room) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError(duplicateRoomMessage(error));
      }
      throw error;
    }
  }

  private async findRoomOrThrow(roomId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }
    return room;
  }

  private async findSessionTypeOrThrow(sessionTypeId: string) {
    const sessionType = await prisma.sessionType.findUnique({ where: { id: sessionTypeId } });
    if (!sessionType) {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }
    return sessionType;
  }

  private async findSessionOrThrow(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });
    if (!session) {
      throw new NotFoundError("Sessão não encontrada.");
    }
    return session;
  }

  private async ensureSessionModalitySettings() {
    await Promise.all(
      ([...SESSION_MODALITIES] as SessionModality[]).map((modality) =>
        prisma.sessionModalitySetting.upsert({
          where: { modality },
          create: {
            modality,
            ...DEFAULT_SESSION_MODALITY_SETTINGS[modality],
            isActive: true,
          },
          update: {},
        }),
      ),
    );
  }

  private async getSessionModalityLimits(modality: SessionModality): Promise<SessionValidationLimits> {
    await this.ensureSessionModalitySettings();
    const setting = await prisma.sessionModalitySetting.findUnique({ where: { modality } });
    if (setting) {
      return {
        minPatients: setting.minPatients,
        maxPatients: setting.maxPatients,
        minProfessionals: setting.minProfessionals,
        maxProfessionals: setting.maxProfessionals,
      };
    }
    return DEFAULT_SESSION_MODALITY_SETTINGS[modality];
  }

  private async validateSessionParticipantsByModality(
    modality: SessionModality,
    patientCount: number,
    professionalCount: number,
  ) {
    const limits = await this.getSessionModalityLimits(modality);
    const formatLabel = SESSION_FORMAT_LABELS[modality] ?? modality;

    if (patientCount < limits.minPatients || patientCount > limits.maxPatients) {
      if (limits.minPatients === limits.maxPatients) {
        throw new ValidationError(
          `Para tipo de sessão ${formatLabel}, selecione exatamente ${limits.minPatients} paciente(s).`,
        );
      }
      throw new ValidationError(
        `Para tipo de sessão ${formatLabel}, selecione entre ${limits.minPatients} e ${limits.maxPatients} pacientes.`,
      );
    }

    if (
      professionalCount < limits.minProfessionals ||
      professionalCount > limits.maxProfessionals
    ) {
      if (limits.minProfessionals === limits.maxProfessionals) {
        throw new ValidationError(
          `Para tipo de sessão ${formatLabel}, selecione exatamente ${limits.minProfessionals} profissional(is).`,
        );
      }
      throw new ValidationError(
        `Para tipo de sessão ${formatLabel}, selecione entre ${limits.minProfessionals} e ${limits.maxProfessionals} profissionais.`,
      );
    }
  }

  private async loadSessionReferences(input: ReturnType<typeof normalizeSessionInput>) {
    const [sessionType, room, patientsCount, professionalsCount] = await Promise.all([
      prisma.sessionType.findUnique({ where: { id: input.sessionTypeId } }),
      prisma.room.findUnique({ where: { id: input.roomId } }),
      prisma.patient.count({
        where: { id: { in: input.patientIds }, isActive: true },
      }),
      prisma.user.count({
        where: {
          id: { in: input.professionalIds },
          role: { in: [...USER_ROLES] },
          isActive: true,
        },
      }),
    ]);

    if (!sessionType || !sessionType.isActive) {
      throw new ValidationError("A modalidade selecionada não existe ou está inativa.");
    }
    if (!room || !room.isActive) {
      throw new ValidationError("A sala selecionada não existe ou está inativa.");
    }
    if (patientsCount !== input.patientIds.length) {
      throw new ValidationError("Um ou mais pacientes selecionados não existem ou estão inativos.");
    }
    if (professionalsCount !== input.professionalIds.length) {
      throw new ValidationError(
        "Um ou mais profissionais selecionados não existem ou estão inativos.",
      );
    }

    return { sessionType, room };
  }

  private assertTechnicianCanComplete(
    session: { professionals: Array<{ professionalId: string }> },
    currentUser: AuthenticatedUser,
  ): void {
    const isOwnerProfessional = session.professionals.some(
      (row) => row.professionalId === currentUser._id,
    );
    if (currentUser.role === "tecnico" && !isOwnerProfessional) {
      throw new ForbiddenError("Técnico só pode concluir a própria sessão.");
    }
  }

  private async assertNoSchedulingConflicts(params: {
    startAt: Date;
    endAt: Date;
    roomId: string;
    patientIds: string[];
    professionalIds: string[];
    excludeSessionId?: string;
  }) {
    const overlapWhere = buildSessionOverlapWhere({
      startAt: params.startAt,
      endAt: params.endAt,
      excludeSessionId: params.excludeSessionId,
    });

    const [roomConflict, professionalConflict, patientConflict] = await Promise.all([
      prisma.session.findFirst({ where: { ...overlapWhere, roomId: params.roomId } }),
      prisma.session.findFirst({
        where: {
          ...overlapWhere,
          professionals: { some: { professionalId: { in: params.professionalIds } } },
        },
      }),
      prisma.session.findFirst({
        where: {
          ...overlapWhere,
          patients: { some: { patientId: { in: params.patientIds } } },
        },
      }),
    ]);

    if (roomConflict) {
      throw new ConflictError("A sala já está ocupada nesse horário. Escolha outro horário ou sala.");
    }
    if (professionalConflict) {
      throw new ConflictError("Um dos profissionais já possui sessão nesse horário.");
    }
    if (patientConflict) {
      throw new ConflictError("Um dos pacientes já possui sessão nesse horário.");
    }
  }
}

export const agendaService = new AgendaService();
