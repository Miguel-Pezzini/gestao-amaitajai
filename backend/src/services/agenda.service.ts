import { Prisma, type SessionStatus as PrismaSessionStatus } from "@prisma/client";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/http-errors.js";
import { prisma } from "../db/prisma.js";
import { duplicateRoomMessage, isPrismaUniqueViolation } from "../db/errors.js";
import {
  serializeSessionForList,
  serializeSessionPlain,
  serializeSessionSeries,
  withMongoId,
  withMongoIdList,
} from "../db/serialize.js";
import {
  buildPatientDeactivatedCancelReason,
  SESSION_FORMAT_LABELS,
  SESSION_MODALITIES,
  USER_ROLES,
  type SessionModality,
  type UpdateScope,
  type UserRole,
} from "../domain/agenda.js";
import {
  containsInsensitive,
  normalizeText,
  parseDate,
  parseLimit,
  parsePage,
  shouldPaginateList,
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
  validateSessionModality,
  validateSessionWithProfessionals,
  validateUpdateSession,
} from "../validators/agenda/session.validator.js";
import {
  resolveOccurrenceProfessional,
  toSeriesProfessionalCreateData,
  toSeriesProfessionalInput,
  toSessionProfessionalCreateData,
  type SessionProfessionalInput,
} from "../validators/agenda/session-professional.validator.js";
import {
  parseRecurrenceInput,
  validatePatientId,
  validateRecurrenceInput,
  validateUpdateScope,
  type RecurrenceInput,
} from "../validators/agenda/recurrence.validator.js";
import {
  formatRecurrenceConflictDates,
  generateRecurrenceDates,
  getTimeMinutesFromDate,
  toDateOnly,
} from "./session-recurrence.helpers.js";
import {
  buildReplacementKey,
  requiresPatientReplacementOnDeactivation,
  shouldCancelSessionOnPatientDeactivation,
} from "./patient-deactivation.helpers.js";
import type { PatientDeactivationReplacementInput } from "../validators/patient-deactivation.validator.js";
import {
  buildSessionOverlapWhere,
  hasProfessionalConflictInSessions,
  indexConflictsByParticipantId,
  indexProfessionalConflictsByEffectiveWindow,
  mapOverlapSessionToConflictShape,
  type ProfessionalAssignment,
} from "./agenda-availability.helpers.js";

type AuthenticatedUser = {
  _id: string;
  role: UserRole;
};

type SessionPayloadWithRecurrence = SessionPayload & {
  recurrence?: unknown;
  updateScope?: unknown;
};

type CancelPayload = {
  cancelReason?: unknown;
  scope?: unknown;
};
type SessionValidationLimits = {
  minPatients: number;
  maxPatients: number;
  minProfessionals: number;
  maxProfessionals: number;
};

const DEFAULT_SESSION_MODALITY_SETTINGS: Record<SessionModality, SessionValidationLimits> = {
  INDIVIDUAL: { minPatients: 1, maxPatients: 1, minProfessionals: 1, maxProfessionals: 1 },
  DUPLA: { minPatients: 2, maxPatients: 2, minProfessionals: 2, maxProfessionals: 2 },
  GRUPO: { minPatients: 1, maxPatients: 15, minProfessionals: 2, maxProfessionals: 4 },
};

const SESSION_LIST_INCLUDE = {
  sessionType: { select: { id: true, name: true, slug: true } },
  room: { select: { id: true, name: true } },
  patients: {
    include: {
      patient: {
        select: { id: true, fullName: true, fundingSource: { select: { id: true, name: true } } },
      },
    },
  },
  professionals: {
    include: {
      professional: { select: { id: true, name: true, email: true, role: true } },
    },
  },
} satisfies Prisma.SessionInclude;

const OVERLAP_SESSION_SELECT = {
  id: true,
  startAt: true,
  endAt: true,
  modality: true,
  sessionType: { select: { name: true } },
  room: { select: { name: true } },
  professionals: {
    select: {
      professionalId: true,
      isApoio: true,
      participationStartAt: true,
      participationEndAt: true,
    },
  },
  patients: { select: { patientId: true } },
} satisfies Prisma.SessionSelect;

function mapStoredProfessionals(
  rows: Array<{
    professionalId: string;
    isApoio?: boolean;
    participationStartAt?: Date | null;
    participationEndAt?: Date | null;
  }>,
): SessionProfessionalInput[] {
  return rows.map((row) => ({
    professionalId: row.professionalId,
    isApoio: row.isApoio ?? false,
    participationStartAt: row.participationStartAt ?? null,
    participationEndAt: row.participationEndAt ?? null,
  }));
}

function toProfessionalAssignments(professionals: SessionProfessionalInput[]): ProfessionalAssignment[] {
  return professionals.map((professional) => ({
    professionalId: professional.professionalId,
    isApoio: professional.isApoio,
    participationStartAt: professional.participationStartAt,
    participationEndAt: professional.participationEndAt,
  }));
}

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
      select: {
        id: true,
        fullName: true,
        guardianName: true,
        fundingSource: { select: { id: true, name: true } },
      },
    });

    return {
      items: rows.map((row) => ({
        _id: row.id,
        fullName: row.fullName,
        guardianName: row.guardianName,
        fundingSource: row.fundingSource.name,
      })),
    };
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
        accountStatus: "ATIVO",
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
      accountStatus: "ATIVO",
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

    const conflictsById = indexProfessionalConflictsByEffectiveWindow(
      overlappingSessions.map(mapOverlapSessionToConflictShape),
      { startAt: input.startAt, endAt: input.endAt },
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
      accountStatus: "ATIVO",
      role: { in: [...USER_ROLES] },
    };
    const overlapWhere = buildSessionOverlapWhere({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const [totalCount, overlappingSessions] = await Promise.all([
      prisma.user.count({ where: baseFilter }),
      prisma.session.findMany({
        where: overlapWhere,
        select: OVERLAP_SESSION_SELECT,
      }),
    ]);

    const conflictsById = indexProfessionalConflictsByEffectiveWindow(
      overlappingSessions.map(mapOverlapSessionToConflictShape),
      { startAt: input.startAt, endAt: input.endAt },
    );
    const busyProfessionalIds = [...conflictsById.keys()];

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
      select: {
        id: true,
        fullName: true,
        guardianName: true,
        fundingSource: { select: { id: true, name: true } },
      },
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
        _id: patient.id,
        fullName: patient.fullName,
        guardianName: patient.guardianName,
        fundingSource: patient.fundingSource.name,
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

    if (!shouldPaginateList(query)) {
      const sessions = await prisma.session.findMany({
        where,
        orderBy: { startAt: "asc" },
        include: SESSION_LIST_INCLUDE,
      });

      return { items: sessions.map(serializeSessionForList) };
    }

    const page = parsePage(query.page, 1);
    const limit = parseLimit(query.limit, 20, 100);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { startAt: "desc" },
        skip,
        take: limit,
        include: SESSION_LIST_INCLUDE,
      }),
      prisma.session.count({ where }),
    ]);

    return {
      items: sessions.map(serializeSessionForList),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createSession(payload: SessionPayloadWithRecurrence, currentUser: AuthenticatedUser) {
    const normalized = normalizeSessionInput(payload);
    const startAt = normalized.startAt as Date;
    const endAt = this.computeSessionEndAt(startAt, normalized.durationMinutes);
    validateSessionWithProfessionals(normalized, endAt);
    await this.validateSessionParticipantsByModality(
      normalized.modality,
      normalized.patientIds.length,
      normalized.professionals.length,
    );

    const references = await this.loadSessionReferences(normalized);
    validateSessionModality(references.sessionType.allowedModalities, normalized.modality);

    const recurrenceInput = parseRecurrenceInput(payload, startAt);
    if (recurrenceInput.enabled) {
      return this.createRecurringSessions(normalized, recurrenceInput, currentUser);
    }

    await this.assertNoSchedulingConflicts({
      startAt,
      endAt,
      roomId: normalized.roomId,
      patientIds: normalized.patientIds,
      professionals: toProfessionalAssignments(normalized.professionals),
    });

    const session = await prisma.session.create({
      data: {
        sessionTypeId: normalized.sessionTypeId,
        modality: normalized.modality,
        roomId: normalized.roomId,
        startAt,
        endAt,
        durationMinutes: normalized.durationMinutes,
        status: "AGENDADA",
        notes: normalized.notes,
        createdById: currentUser._id,
        updatedById: currentUser._id,
        patients: {
          create: normalized.patientIds.map((patientId) => ({ patientId })),
        },
        professionals: {
          create: normalized.professionals.map(toSessionProfessionalCreateData),
        },
      },
      include: {
        patients: { select: { patientId: true } },
        professionals: {
          select: {
            professionalId: true,
            isApoio: true,
            participationStartAt: true,
            participationEndAt: true,
          },
        },
      },
    });

    return { session: serializeSessionPlain(session) };
  }

  async updateSession(
    sessionId: string,
    payload: SessionPayloadWithRecurrence,
    currentUser: AuthenticatedUser,
  ) {
    const existing = await this.findSessionOrThrow(sessionId);
    validateUpdateSession(sessionId, existing.status);
    const updateScope = validateUpdateScope(payload.updateScope);

    const normalized = normalizeSessionInput(payload, {
      sessionTypeId: existing.sessionTypeId,
      modality: existing.modality as SessionModality,
      roomId: existing.roomId,
      startAt: existing.startAt,
      durationMinutes: existing.durationMinutes,
      patientIds: existing.patients.map((row) => row.patientId),
      professionals: mapStoredProfessionals(existing.professionals),
      notes: existing.notes,
    });
    const payloadStartAt = normalized.startAt as Date;

    const targetSessions = await this.getSessionsForUpdateScope(existing, updateScope);
    const excludeSessionIds = targetSessions.map((item) => item.id);

    for (const target of targetSessions) {
      const { startAt, endAt } = this.computeUpdatedSessionTimes(
        updateScope,
        target.startAt,
        payloadStartAt,
        normalized.durationMinutes,
      );
      validateSessionWithProfessionals(normalized, endAt);
      await this.assertNoSchedulingConflicts({
        startAt,
        endAt,
        roomId: normalized.roomId,
        patientIds: normalized.patientIds,
        professionals: toProfessionalAssignments(normalized.professionals),
        excludeSessionIds,
      });
    }

    await this.validateSessionParticipantsByModality(
      normalized.modality,
      normalized.patientIds.length,
      normalized.professionals.length,
    );

    const references = await this.loadSessionReferences(normalized);
    validateSessionModality(references.sessionType.allowedModalities, normalized.modality);

    const session = await prisma.$transaction(async (tx) => {
      for (const target of targetSessions) {
        const { startAt, endAt } = this.computeUpdatedSessionTimes(
          updateScope,
          target.startAt,
          payloadStartAt,
          normalized.durationMinutes,
        );

        await tx.sessionPatient.deleteMany({ where: { sessionId: target.id } });
        await tx.sessionProfessional.deleteMany({ where: { sessionId: target.id } });

        await tx.session.update({
          where: { id: target.id },
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
              create: normalized.professionals.map((professional) => {
                if (updateScope === "SINGLE") {
                  return toSessionProfessionalCreateData(professional);
                }

                const occurrenceProfessional = resolveOccurrenceProfessional(
                  toSeriesProfessionalInput(professional),
                  startAt,
                  endAt,
                );
                return toSessionProfessionalCreateData(occurrenceProfessional);
              }),
            },
          },
        });
      }

      if (existing.seriesId && updateScope !== "SINGLE") {
        await this.applySeriesMetadataUpdate(
          tx,
          existing.seriesId,
          normalized,
          payloadStartAt,
          currentUser,
        );
      }

      return tx.session.findUniqueOrThrow({
        where: { id: sessionId },
        include: SESSION_LIST_INCLUDE,
      });
    });

    return {
      session: serializeSessionForList(session),
      sessionsUpdated: targetSessions.length,
    };
  }

  async cancelSession(
    sessionId: string,
    payload: CancelPayload,
    currentUser: AuthenticatedUser,
  ) {
    const { cancelReason, scope } = validateCancelSession(sessionId, payload);
    const existing = await this.findSessionOrThrow(sessionId);

    if (existing.status === "CANCELADA") {
      throw new ValidationError("Sessão já está cancelada.");
    }

    if (scope === "SINGLE" || !existing.seriesId) {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "CANCELADA",
          cancelReason,
          cancelledAt: new Date(),
          updatedById: currentUser._id,
        },
        include: {
          patients: { select: { patientId: true } },
          professionals: { select: { professionalId: true } },
        },
      });
      return { session: serializeSessionPlain(session), sessionsCancelled: 1 };
    }

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const where: Prisma.SessionWhereInput =
        scope === "FUTURE"
          ? {
              seriesId: existing.seriesId,
              status: "AGENDADA",
              startAt: { gte: existing.startAt },
            }
          : {
              seriesId: existing.seriesId,
              status: "AGENDADA",
            };

      const cancelled = await tx.session.updateMany({
        where,
        data: {
          status: "CANCELADA",
          cancelReason,
          cancelledAt: now,
          updatedById: currentUser._id,
        },
      });

      if (scope === "ALL") {
        await tx.sessionSeries.update({
          where: { id: existing.seriesId! },
          data: {
            status: "CANCELADA",
            cancelReason,
            cancelledAt: now,
            updatedById: currentUser._id,
          },
        });
      }

      return cancelled.count;
    });

    const session = await prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });

    return {
      session: serializeSessionPlain(session),
      sessionsCancelled: result,
    };
  }

  async getPatientDeactivationImpact(patientId: string) {
    validatePatientId(patientId);

    const sessions = await this.findScheduledSessionsForPatient(patientId);
    const cancellations: Array<{
      sessionId: string;
      modality: SessionModality;
      startAt: Date;
      sessionTypeName: string;
      roomName: string;
    }> = [];
    const replacementSessions: typeof sessions = [];

    for (const session of sessions) {
      const patientCountInSession = session.patients.length;
      const modality = session.modality as SessionModality;

      if (shouldCancelSessionOnPatientDeactivation(modality, patientCountInSession)) {
        cancellations.push({
          sessionId: session.id,
          modality,
          startAt: session.startAt,
          sessionTypeName: session.sessionType.name,
          roomName: session.room.name,
        });
        continue;
      }

      if (requiresPatientReplacementOnDeactivation(modality, patientCountInSession)) {
        replacementSessions.push(session);
      }
    }

    const seriesGroups = new Map<string, typeof sessions>();
    const standaloneSessions: typeof sessions = [];

    for (const session of replacementSessions) {
      if (session.seriesId) {
        const current = seriesGroups.get(session.seriesId) ?? [];
        current.push(session);
        seriesGroups.set(session.seriesId, current);
      } else {
        standaloneSessions.push(session);
      }
    }

    const replacements = [
      ...Array.from(seriesGroups.entries()).map(([seriesId, groupedSessions]) => {
        const first = groupedSessions[0]!;
        return {
          key: buildReplacementKey({ seriesId }),
          type: "series" as const,
          seriesId,
          modality: first.modality as SessionModality,
          sessionTypeName: first.sessionType.name,
          roomName: first.room.name,
          sessionCount: groupedSessions.length,
          nextStartAt: first.startAt,
          weekdays: first.series?.weekdays ?? [],
          otherPatients: this.serializeOtherPatients(first, patientId),
        };
      }),
      ...standaloneSessions.map((session) => ({
        key: buildReplacementKey({ sessionId: session.id }),
        type: "session" as const,
        sessionId: session.id,
        modality: session.modality as SessionModality,
        sessionTypeName: session.sessionType.name,
        roomName: session.room.name,
        sessionCount: 1,
        nextStartAt: session.startAt,
        weekdays: [] as number[],
        otherPatients: this.serializeOtherPatients(session, patientId),
      })),
    ];

    return {
      cancellations,
      replacements,
      requiresReplacement: replacements.length > 0,
    };
  }

  async handlePatientDeactivation(
    patientId: string,
    patientFullName: string,
    currentUser: AuthenticatedUser,
    replacementsInput: PatientDeactivationReplacementInput[] = [],
  ) {
    validatePatientId(patientId);

    const impact = await this.getPatientDeactivationImpact(patientId);
    const replacementByKey = this.buildReplacementMap(replacementsInput);
    this.assertReplacementCoverage(impact.replacements, replacementByKey, patientId);

    const now = new Date();
    const cancelReason = buildPatientDeactivatedCancelReason(patientFullName);
    let sessionsCancelled = 0;
    let sessionsReplaced = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of impact.replacements) {
        const replacement = replacementByKey.get(item.key);
        if (!replacement) {
          continue;
        }

        if (item.type === "series" && item.seriesId) {
          sessionsReplaced += await this.applySeriesPatientReplacement(
            tx,
            item.seriesId,
            patientId,
            replacement.replacementPatientId,
            currentUser,
          );
          continue;
        }

        if (item.type === "session" && item.sessionId) {
          await this.applySessionPatientReplacement(
            tx,
            item.sessionId,
            patientId,
            replacement.replacementPatientId,
            currentUser,
          );
          sessionsReplaced += 1;
        }
      }

      for (const cancellation of impact.cancellations) {
        await tx.session.update({
          where: { id: cancellation.sessionId },
          data: {
            status: "CANCELADA",
            cancelReason,
            cancelledAt: now,
            updatedById: currentUser._id,
          },
        });
        sessionsCancelled += 1;
      }

      await tx.sessionSeriesPatient.deleteMany({
        where: {
          patientId,
          series: { status: "ATIVA" },
        },
      });
    });

    return { sessionsCancelled, sessionsReplaced };
  }

  /** Sessões pendentes (`agendada`) em que o paciente participa; realizadas/canceladas ficam intactas. */
  private async findScheduledSessionsForPatient(patientId: string) {
    return prisma.session.findMany({
      where: {
        status: "AGENDADA",
        patients: { some: { patientId } },
      },
      include: {
        sessionType: { select: { name: true } },
        room: { select: { name: true } },
        series: { select: { weekdays: true, timeMinutes: true } },
        patients: {
          include: { patient: { select: { id: true, fullName: true } } },
        },
        professionals: { select: { professionalId: true } },
      },
      orderBy: { startAt: "asc" },
    });
  }

  private serializeOtherPatients(
    session: {
      patients: Array<{ patientId: string; patient: { id: string; fullName: string } }>;
    },
    patientId: string,
  ) {
    return session.patients
      .filter((row) => row.patientId !== patientId)
      .map((row) => ({
        id: row.patient.id,
        fullName: row.patient.fullName,
      }));
  }

  private buildReplacementMap(replacementsInput: PatientDeactivationReplacementInput[]) {
    const replacementByKey = new Map<string, PatientDeactivationReplacementInput>();

    for (const replacement of replacementsInput) {
      const key = buildReplacementKey({
        seriesId: replacement.seriesId,
        sessionId: replacement.sessionId,
      });
      replacementByKey.set(key, replacement);
    }

    return replacementByKey;
  }

  private assertReplacementCoverage(
    requiredReplacements: Array<{ key: string }>,
    replacementByKey: Map<string, PatientDeactivationReplacementInput>,
    patientId: string,
  ) {
    if (requiredReplacements.length === 0) {
      return;
    }

    if (replacementByKey.size !== requiredReplacements.length) {
      throw new ValidationError(
        "Informe o paciente substituto para todas as sessões que exigem troca.",
      );
    }

    for (const item of requiredReplacements) {
      const replacement = replacementByKey.get(item.key);
      if (!replacement || replacement.replacementPatientId === patientId) {
        throw new ValidationError(
          replacement?.replacementPatientId === patientId
            ? "O paciente substituto deve ser diferente do paciente inativado."
            : "Informe o paciente substituto para todas as sessões que exigem troca.",
        );
      }
    }
  }

  private async applySeriesPatientReplacement(
    tx: Prisma.TransactionClient,
    seriesId: string,
    oldPatientId: string,
    newPatientId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertReplacementPatientAvailable(tx, newPatientId, oldPatientId);

    const seriesSessions = await tx.session.findMany({
      where: {
        seriesId,
        status: "AGENDADA",
        patients: { some: { patientId: oldPatientId } },
      },
      include: {
        patients: { select: { patientId: true } },
        professionals: {
          select: {
            professionalId: true,
            isApoio: true,
            participationStartAt: true,
            participationEndAt: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    });

    if (seriesSessions.length === 0) {
      throw new ValidationError("Nenhuma sessão agendada encontrada para a série informada.");
    }

    const alreadyInSeries = await tx.sessionSeriesPatient.findFirst({
      where: { seriesId, patientId: newPatientId },
    });
    if (alreadyInSeries) {
      throw new ValidationError("O paciente substituto já participa desta série.");
    }

    for (const session of seriesSessions) {
      if (session.patients.some((row) => row.patientId === newPatientId)) {
        throw new ValidationError("O paciente substituto já participa de uma sessão desta série.");
      }

      const nextPatientIds = session.patients
        .map((row) => row.patientId)
        .filter((id) => id !== oldPatientId);
      nextPatientIds.push(newPatientId);

      await this.assertNoSchedulingConflicts({
        startAt: session.startAt,
        endAt: session.endAt,
        roomId: session.roomId,
        patientIds: nextPatientIds,
        professionals: toProfessionalAssignments(mapStoredProfessionals(session.professionals)),
        excludeSessionId: session.id,
      });
    }

    await tx.sessionSeriesPatient.deleteMany({
      where: { seriesId, patientId: oldPatientId },
    });
    await tx.sessionSeriesPatient.create({
      data: { seriesId, patientId: newPatientId },
    });
    await tx.sessionSeries.update({
      where: { id: seriesId },
      data: { updatedById: currentUser._id },
    });

    for (const session of seriesSessions) {
      await tx.sessionPatient.deleteMany({
        where: { sessionId: session.id, patientId: oldPatientId },
      });
      await tx.sessionPatient.create({
        data: { sessionId: session.id, patientId: newPatientId },
      });
      await tx.session.update({
        where: { id: session.id },
        data: { updatedById: currentUser._id },
      });
    }

    return seriesSessions.length;
  }

  private async applySessionPatientReplacement(
    tx: Prisma.TransactionClient,
    sessionId: string,
    oldPatientId: string,
    newPatientId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertReplacementPatientAvailable(tx, newPatientId, oldPatientId);

    const session = await tx.session.findUnique({
      where: { id: sessionId },
      include: {
        patients: { select: { patientId: true } },
        professionals: {
          select: {
            professionalId: true,
            isApoio: true,
            participationStartAt: true,
            participationEndAt: true,
          },
        },
      },
    });

    if (!session || session.status !== "AGENDADA") {
      throw new ValidationError("Sessão agendada não encontrada para substituição.");
    }

    if (!session.patients.some((row) => row.patientId === oldPatientId)) {
      throw new ValidationError("O paciente inativado não participa desta sessão.");
    }

    if (session.patients.some((row) => row.patientId === newPatientId)) {
      throw new ValidationError("O paciente substituto já participa desta sessão.");
    }

    const nextPatientIds = session.patients
      .map((row) => row.patientId)
      .filter((id) => id !== oldPatientId);
    nextPatientIds.push(newPatientId);

    await this.assertNoSchedulingConflicts({
      startAt: session.startAt,
      endAt: session.endAt,
      roomId: session.roomId,
      patientIds: nextPatientIds,
      professionals: toProfessionalAssignments(mapStoredProfessionals(session.professionals)),
      excludeSessionId: session.id,
    });

    await tx.sessionPatient.deleteMany({
      where: { sessionId, patientId: oldPatientId },
    });
    await tx.sessionPatient.create({
      data: { sessionId, patientId: newPatientId },
    });
    await tx.session.update({
      where: { id: sessionId },
      data: { updatedById: currentUser._id },
    });
  }

  private async assertReplacementPatientAvailable(
    tx: Prisma.TransactionClient,
    replacementPatientId: string,
    deactivatedPatientId: string,
  ) {
    if (replacementPatientId === deactivatedPatientId) {
      throw new ValidationError("O paciente substituto deve ser diferente do paciente inativado.");
    }

    const replacementPatient = await tx.patient.findUnique({
      where: { id: replacementPatientId },
      select: { isActive: true },
    });

    if (!replacementPatient?.isActive) {
      throw new ValidationError("O paciente substituto não existe ou está inativo.");
    }
  }

  async completeSession(sessionId: string, currentUser: AuthenticatedUser) {
    const existing = await this.findSessionOrThrow(sessionId);
    validateCompleteSession(sessionId, existing.status);
    this.assertTechnicianCanComplete(existing, currentUser);

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "REALIZADA",
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
    const status = normalizeText(query.status).toUpperCase();
    if (status && ["AGENDADA", "REALIZADA", "CANCELADA"].includes(status)) {
      where.status = status as PrismaSessionStatus;
    } else if (!this.queryIncludesCancelled(query)) {
      where.status = { not: "CANCELADA" };
    }

    const startAt = parseDate(query.startAt);
    const endAt = parseDate(query.endAt);
    if (startAt && endAt) {
      where.startAt = { lt: endAt };
      where.endAt = { gt: startAt };
    }

    const patientId = normalizeText(query.patientId);
    if (patientId && isUuid(patientId)) {
      where.patients = { some: { patientId } };
    }

    const professionalId = normalizeText(query.professionalId);
    if (professionalId && isUuid(professionalId) && currentUser.role === "ADMINISTRADOR") {
      where.professionals = { some: { professionalId } };
    }

    if (currentUser.role === "TECNICO") {
      where.professionals = { some: { professionalId: currentUser._id } };
    }

    return where;
  }

  private queryIncludesCancelled(query: Record<string, unknown>): boolean {
    const raw = query.includeCancelled;
    return raw === true || raw === "true" || raw === "1";
  }

  private computeSessionEndAt(startAt: Date, durationMinutes: number): Date {
    return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  }

  private async createRecurringSessions(
    normalized: ReturnType<typeof normalizeSessionInput>,
    recurrenceInput: RecurrenceInput,
    currentUser: AuthenticatedUser,
  ) {
    const startAt = normalized.startAt as Date;
    const { weekdays, endsAt } = validateRecurrenceInput(recurrenceInput, startAt);
    const dates = generateRecurrenceDates({ startAt, weekdays, endsAt });

    if (dates.length === 0) {
      throw new ValidationError("Nenhuma ocorrência encontrada para o período selecionado.");
    }

    const seriesProfessionals = normalized.professionals.map((professional) =>
      toSeriesProfessionalInput(professional),
    );

    const conflictDates = await this.findRecurrenceConflictDates({
      dates,
      durationMinutes: normalized.durationMinutes,
      roomId: normalized.roomId,
      patientIds: normalized.patientIds,
      seriesProfessionals,
    });

    if (conflictDates.length > 0) {
      throw new ConflictError(
        `Conflito de agenda em ${conflictDates.length} data(s): ${formatRecurrenceConflictDates(conflictDates)}.`,
      );
    }

    const timeMinutes = getTimeMinutesFromDate(startAt);
    const result = await prisma.$transaction(async (tx) => {
      const series = await tx.sessionSeries.create({
        data: {
          sessionTypeId: normalized.sessionTypeId,
          modality: normalized.modality,
          roomId: normalized.roomId,
          weekdays,
          startsAt: toDateOnly(startAt),
          endsAt: toDateOnly(endsAt),
          timeMinutes,
          durationMinutes: normalized.durationMinutes,
          notes: normalized.notes,
          createdById: currentUser._id,
          updatedById: currentUser._id,
          patients: {
            create: normalized.patientIds.map((patientId) => ({ patientId })),
          },
          professionals: {
            create: seriesProfessionals.map(toSeriesProfessionalCreateData),
          },
        },
      });

      for (const occurrenceStart of dates) {
        const occurrenceEnd = this.computeSessionEndAt(
          occurrenceStart,
          normalized.durationMinutes,
        );
        const occurrenceProfessionals = seriesProfessionals.map((professional) =>
          resolveOccurrenceProfessional(professional, occurrenceStart, occurrenceEnd),
        );

        await tx.session.create({
          data: {
            seriesId: series.id,
            sessionTypeId: normalized.sessionTypeId,
            modality: normalized.modality,
            roomId: normalized.roomId,
            startAt: occurrenceStart,
            endAt: occurrenceEnd,
            durationMinutes: normalized.durationMinutes,
            status: "AGENDADA",
            notes: normalized.notes,
            createdById: currentUser._id,
            updatedById: currentUser._id,
            patients: {
              create: normalized.patientIds.map((patientId) => ({ patientId })),
            },
            professionals: {
              create: occurrenceProfessionals.map(toSessionProfessionalCreateData),
            },
          },
        });
      }

      return series;
    });

    return {
      series: serializeSessionSeries(result),
      sessionsCreated: dates.length,
    };
  }

  private async findRecurrenceConflictDates(params: {
    dates: Date[];
    durationMinutes: number;
    roomId: string;
    patientIds: string[];
    seriesProfessionals: ReturnType<typeof toSeriesProfessionalInput>[];
  }): Promise<Date[]> {
    const conflicts: Date[] = [];

    for (const startAt of params.dates) {
      const endAt = this.computeSessionEndAt(startAt, params.durationMinutes);
      const occurrenceProfessionals = params.seriesProfessionals.map((professional) =>
        resolveOccurrenceProfessional(professional, startAt, endAt),
      );

      try {
        await this.assertNoSchedulingConflicts({
          startAt,
          endAt,
          roomId: params.roomId,
          patientIds: params.patientIds,
          professionals: toProfessionalAssignments(occurrenceProfessionals),
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          conflicts.push(startAt);
          continue;
        }
        throw error;
      }
    }

    return conflicts;
  }

  private async getSessionsForUpdateScope(
    existing: Awaited<ReturnType<AgendaService["findSessionOrThrow"]>>,
    updateScope: UpdateScope,
  ) {
    if (updateScope === "SINGLE" || !existing.seriesId) {
      return [existing];
    }

    const where: Prisma.SessionWhereInput =
      updateScope === "FUTURE"
        ? {
            seriesId: existing.seriesId,
            status: "AGENDADA",
            startAt: { gte: existing.startAt },
          }
        : {
            seriesId: existing.seriesId,
            status: "AGENDADA",
          };

    return prisma.session.findMany({
      where,
      orderBy: { startAt: "asc" },
      include: {
        patients: { select: { patientId: true } },
        professionals: { select: { professionalId: true } },
      },
    });
  }

  private computeUpdatedSessionTimes(
    updateScope: UpdateScope,
    originalStartAt: Date,
    payloadStartAt: Date,
    durationMinutes: number,
  ): { startAt: Date; endAt: Date } {
    let startAt: Date;
    if (updateScope === "SINGLE") {
      startAt = payloadStartAt;
    } else {
      startAt = new Date(originalStartAt);
      startAt.setHours(payloadStartAt.getHours(), payloadStartAt.getMinutes(), 0, 0);
    }

    return {
      startAt,
      endAt: this.computeSessionEndAt(startAt, durationMinutes),
    };
  }

  private async applySeriesMetadataUpdate(
    tx: Prisma.TransactionClient,
    seriesId: string,
    normalized: ReturnType<typeof normalizeSessionInput>,
    payloadStartAt: Date,
    currentUser: AuthenticatedUser,
  ) {
    const seriesProfessionals = normalized.professionals.map((professional) =>
      toSeriesProfessionalInput(professional),
    );

    await tx.sessionSeriesPatient.deleteMany({ where: { seriesId } });
    await tx.sessionSeriesPatient.createMany({
      data: normalized.patientIds.map((patientId) => ({ seriesId, patientId })),
    });

    await tx.sessionSeriesProfessional.deleteMany({ where: { seriesId } });
    await tx.sessionSeriesProfessional.createMany({
      data: seriesProfessionals.map((professional) => ({
        seriesId,
        ...toSeriesProfessionalCreateData(professional),
      })),
    });

    await tx.sessionSeries.update({
      where: { id: seriesId },
      data: {
        sessionTypeId: normalized.sessionTypeId,
        modality: normalized.modality,
        roomId: normalized.roomId,
        durationMinutes: normalized.durationMinutes,
        timeMinutes: getTimeMinutesFromDate(payloadStartAt),
        notes: normalized.notes,
        updatedById: currentUser._id,
      },
    });
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
        professionals: {
          select: {
            professionalId: true,
            isApoio: true,
            participationStartAt: true,
            participationEndAt: true,
          },
        },
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
    const professionalIds = input.professionals.map((item) => item.professionalId);
    const [sessionType, room, patientsCount, professionalsCount] = await Promise.all([
      prisma.sessionType.findUnique({ where: { id: input.sessionTypeId } }),
      prisma.room.findUnique({ where: { id: input.roomId } }),
      prisma.patient.count({
        where: { id: { in: input.patientIds }, isActive: true },
      }),
      prisma.user.count({
        where: {
          id: { in: professionalIds },
          role: { in: [...USER_ROLES] },
          accountStatus: "ATIVO",
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
    if (professionalsCount !== professionalIds.length) {
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
    if (currentUser.role === "TECNICO" && !isOwnerProfessional) {
      throw new ForbiddenError("Técnico só pode concluir a própria sessão.");
    }
  }

  private async assertNoSchedulingConflicts(params: {
    startAt: Date;
    endAt: Date;
    roomId: string;
    patientIds: string[];
    professionals: ProfessionalAssignment[];
    excludeSessionId?: string;
    excludeSessionIds?: string[];
  }) {
    const overlapWhere = buildSessionOverlapWhere({
      startAt: params.startAt,
      endAt: params.endAt,
      excludeSessionId: params.excludeSessionId,
      excludeSessionIds: params.excludeSessionIds,
    });

    const professionalIds = params.professionals.map((item) => item.professionalId);
    const candidateBounds = { startAt: params.startAt, endAt: params.endAt };

    const [roomConflict, overlappingSessions, patientConflict] = await Promise.all([
      prisma.session.findFirst({ where: { ...overlapWhere, roomId: params.roomId } }),
      professionalIds.length === 0
        ? Promise.resolve([])
        : prisma.session.findMany({
            where: {
              ...overlapWhere,
              professionals: { some: { professionalId: { in: professionalIds } } },
            },
            select: OVERLAP_SESSION_SELECT,
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

    const professionalConflict = hasProfessionalConflictInSessions(
      overlappingSessions.map(mapOverlapSessionToConflictShape),
      params.professionals,
      candidateBounds,
    );
    if (professionalConflict) {
      throw new ConflictError("Um dos profissionais já possui sessão nesse horário.");
    }

    if (patientConflict) {
      throw new ConflictError("Um dos pacientes já possui sessão nesse horário.");
    }
  }
}

export const agendaService = new AgendaService();
