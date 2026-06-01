import mongoose from "mongoose";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/http-errors.js";
import { Patient } from "../models/patient.model.js";
import { Room } from "../models/room.model.js";
import { SessionModalitySetting } from "../models/session-modality-setting.model.js";
import { Session } from "../models/session.model.js";
import { SessionType, type SessionModality } from "../models/session-type.model.js";
import { USER_ROLES, type UserRole, User } from "../models/user.model.js";
import {
  duplicateRoomMessage,
  escapeRegex,
  isMongoDuplicateKeyError,
  normalizeText,
  parseDate,
  parseLimit,
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
  buildNameSearchMatcher,
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
  buildSessionOverlapFilter,
  indexConflictsByParticipantId,
} from "./agenda-availability.helpers.js";
import type { Types } from "mongoose";

type AuthenticatedUser = {
  _id: Types.ObjectId;
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
    const matcher = new RegExp(escapeRegex(term), "i");
    const items = await Patient.find({
      isActive: true,
      $or: [{ fullName: matcher }, { guardianName: matcher }],
    })
      .sort({ fullName: 1 })
      .limit(limit)
      .select("_id fullName guardianName fundingSource")
      .lean();

    return { items };
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
    const matcher = new RegExp(escapeRegex(term), "i");
    const items = await User.find({
      isActive: true,
      role: { $in: USER_ROLES as unknown as UserRole[] },
      $or: [{ name: matcher }, { email: matcher }],
    })
      .sort({ name: 1 })
      .limit(limit)
      .select("_id name email role")
      .lean();

    return { items };
  }

  private async listProfessionalsAvailability(
    input: NonNullable<ReturnType<typeof parseAvailabilityLookupQuery>>,
  ) {
    if (input.summaryOnly) {
      return this.getProfessionalsAvailabilitySummary(input);
    }

    const matcher = buildNameSearchMatcher(input.q);
    const userFilter: Record<string, unknown> = {
      isActive: true,
      role: { $in: USER_ROLES as unknown as UserRole[] },
    };
    if (matcher) {
      userFilter.$or = [{ name: matcher }, { email: matcher }];
    }

    const listLimit = matcher ? input.limit : 200;
    const professionals = await User.find(userFilter)
      .sort({ name: 1 })
      .limit(listLimit)
      .select("_id name email role")
      .lean();

    const professionalIds = professionals.map((item) => item._id);
    const overlapFilter = buildSessionOverlapFilter({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const overlappingSessions =
      professionalIds.length === 0
        ? []
        : await Session.find({
            ...overlapFilter,
            professionalIds: { $in: professionalIds },
          })
            .select("startAt endAt modality sessionTypeId roomId professionalIds patientIds")
            .populate("sessionTypeId", "name")
            .populate("roomId", "name")
            .lean();

    const conflictsById = indexConflictsByParticipantId(
      overlappingSessions as Parameters<typeof indexConflictsByParticipantId>[0],
      "professionalIds",
    );

    const items = professionals.map((professional) => {
      const id = professional._id.toString();
      const conflictSession = conflictsById.get(id) ?? null;
      return {
        ...professional,
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
    const baseFilter = {
      isActive: true,
      role: { $in: USER_ROLES as unknown as UserRole[] },
    };
    const overlapFilter = buildSessionOverlapFilter({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const [totalCount, busyProfessionalIds] = await Promise.all([
      User.countDocuments(baseFilter),
      Session.distinct("professionalIds", overlapFilter),
    ]);

    const availableCount = await User.countDocuments({
      ...baseFilter,
      _id: { $nin: busyProfessionalIds },
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

    const matcher = buildNameSearchMatcher(input.q);
    const patientFilter: Record<string, unknown> = { isActive: true };
    if (matcher) {
      patientFilter.$or = [{ fullName: matcher }, { guardianName: matcher }];
    }

    const patients = await Patient.find(patientFilter)
      .sort({ fullName: 1 })
      .limit(input.limit)
      .select("_id fullName guardianName fundingSource")
      .lean();

    const patientIds = patients.map((item) => item._id);
    const overlapFilter = buildSessionOverlapFilter({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const overlappingSessions =
      patientIds.length === 0
        ? []
        : await Session.find({
            ...overlapFilter,
            patientIds: { $in: patientIds },
          })
            .select("startAt endAt modality sessionTypeId roomId professionalIds patientIds")
            .populate("sessionTypeId", "name")
            .populate("roomId", "name")
            .lean();

    const conflictsById = indexConflictsByParticipantId(
      overlappingSessions as Parameters<typeof indexConflictsByParticipantId>[0],
      "patientIds",
    );

    const items = patients.map((patient) => {
      const id = patient._id.toString();
      const conflictSession = conflictsById.get(id) ?? null;
      return {
        ...patient,
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
    const baseFilter = { isActive: true };
    const overlapFilter = buildSessionOverlapFilter({
      startAt: input.startAt,
      endAt: input.endAt,
      excludeSessionId: input.excludeSessionId,
    });

    const [totalCount, busyPatientIds] = await Promise.all([
      Patient.countDocuments(baseFilter),
      Session.distinct("patientIds", overlapFilter),
    ]);

    const availableCount = await Patient.countDocuments({
      ...baseFilter,
      _id: { $nin: busyPatientIds },
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
    const items = await Room.find().sort({ name: 1 }).lean();
    return { items };
  }

  async createRoom(payload: { name?: unknown }) {
    const { name } = validateCreateRoom(payload);
    return this.persistRoomCreate(name);
  }

  async updateRoom(roomId: string, payload: { name?: unknown }) {
    const updates = validateUpdateRoom(roomId, payload);
    const room = await this.findRoomOrThrow(roomId);
    if (updates.name) {
      room.name = updates.name;
    }
    return this.persistRoomSave(room);
  }

  async updateRoomStatus(roomId: string, isActive: boolean) {
    validateRoomId(roomId);
    const room = await Room.findByIdAndUpdate(roomId, { isActive }, { new: true }).lean();
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }
    return { room };
  }

  async listSessionTypes() {
    const items = await SessionType.find().sort({ name: 1 }).lean();
    return { items };
  }

  async createSessionType(payload: {
    name?: unknown;
    slug?: unknown;
    defaultDurationMinutes?: unknown;
    isDurationFlexible?: unknown;
    allowedModalities?: unknown;
  }) {
    const input = validateCreateSessionType(payload);
    const sessionType = await SessionType.create(input);
    return { sessionType };
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
    const sessionType = await this.findSessionTypeOrThrow(sessionTypeId);
    validateUpdateSessionType(sessionTypeId, payload, sessionType);
    await sessionType.save();
    return { sessionType };
  }

  async updateSessionTypeStatus(sessionTypeId: string, isActive: boolean) {
    validateSessionTypeId(sessionTypeId);
    const sessionType = await SessionType.findByIdAndUpdate(
      sessionTypeId,
      { isActive },
      { new: true },
    ).lean();

    if (!sessionType) {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }

    return { sessionType };
  }

  async listSessions(query: Record<string, unknown>, currentUser: AuthenticatedUser) {
    const filter = this.buildSessionListFilter(query, currentUser);
    const items = await Session.find(filter)
      .sort({ startAt: 1 })
      .populate("sessionTypeId", "name slug")
      .populate("roomId", "name")
      .populate("patientIds", "fullName fundingSource")
      .populate("professionalIds", "name email role")
      .lean();

    return { items };
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

    const session = await Session.create({
      sessionTypeId: normalized.sessionTypeId,
      modality: normalized.modality,
      roomId: normalized.roomId,
      startAt,
      endAt,
      durationMinutes: normalized.durationMinutes,
      status: "agendada",
      patientIds: normalized.patientIds,
      professionalIds: normalized.professionalIds,
      notes: normalized.notes,
      createdBy: currentUser._id,
      updatedBy: currentUser._id,
    });

    return { session };
  }

  async updateSession(
    sessionId: string,
    payload: SessionPayload,
    currentUser: AuthenticatedUser,
  ) {
    const existing = await this.findSessionOrThrow(sessionId);
    validateUpdateSession(sessionId, existing.status);

    const normalized = normalizeSessionInput(payload, {
      sessionTypeId: existing.sessionTypeId.toString(),
      modality: existing.modality as SessionModality,
      roomId: existing.roomId.toString(),
      startAt: existing.startAt,
      durationMinutes: existing.durationMinutes,
      patientIds: existing.patientIds.map((id) => id.toString()),
      professionalIds: existing.professionalIds.map((id) => id.toString()),
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

    this.applySessionUpdates(existing, normalized, startAt, endAt, currentUser);
    await existing.save();
    return { session: existing };
  }

  async cancelSession(
    sessionId: string,
    payload: { cancelReason?: unknown },
    currentUser: AuthenticatedUser,
  ) {
    const { cancelReason } = validateCancelSession(sessionId, payload);

    const session = await Session.findByIdAndUpdate(
      sessionId,
      {
        status: "cancelada",
        cancelReason,
        cancelledAt: new Date(),
        updatedBy: currentUser._id,
      },
      { new: true, runValidators: true },
    ).lean();

    if (!session) {
      throw new NotFoundError("Sessão não encontrada.");
    }

    return { session };
  }

  async completeSession(sessionId: string, currentUser: AuthenticatedUser) {
    const session = await this.findSessionOrThrow(sessionId);
    validateCompleteSession(sessionId, session.status);
    this.assertTechnicianCanComplete(session, currentUser);

    session.status = "realizada";
    session.updatedBy = currentUser._id;
    await session.save();

    return { session };
  }

  async listSessionModalitySettings() {
    await this.ensureSessionModalitySettings();
    const items = await SessionModalitySetting.find().sort({ modality: 1 }).lean();
    return { items };
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
    const setting = await SessionModalitySetting.findOne({ modality: input.modality });
    if (!setting) {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }

    setting.minPatients = input.minPatients;
    setting.maxPatients = input.maxPatients;
    setting.minProfessionals = input.minProfessionals;
    setting.maxProfessionals = input.maxProfessionals;
    if (input.isActive !== undefined) {
      setting.isActive = input.isActive;
    }
    await setting.save();

    return { setting };
  }

  private buildSessionListFilter(
    query: Record<string, unknown>,
    currentUser: AuthenticatedUser,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const status = normalizeText(query.status);
    if (status && ["agendada", "realizada", "cancelada"].includes(status)) {
      filter.status = status;
    }

    const startAt = parseDate(query.startAt);
    const endAt = parseDate(query.endAt);
    if (startAt && endAt) {
      filter.startAt = { $lt: endAt };
      filter.endAt = { $gt: startAt };
    }

    const professionalId = normalizeText(query.professionalId);
    if (professionalId && mongoose.Types.ObjectId.isValid(professionalId) && currentUser.role === "administrador") {
      filter.professionalIds = professionalId;
    }

    if (currentUser.role === "tecnico") {
      filter.professionalIds = currentUser._id;
    }

    return filter;
  }

  private computeSessionEndAt(startAt: Date, durationMinutes: number): Date {
    return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
  }

  private async persistRoomCreate(name: string) {
    try {
      const room = await Room.create({ name });
      return { room };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictError(duplicateRoomMessage(error));
      }
      throw error;
    }
  }

  private async persistRoomSave(room: InstanceType<typeof Room>) {
    try {
      await room.save();
      return { room };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictError(duplicateRoomMessage(error));
      }
      throw error;
    }
  }

  private async findRoomOrThrow(roomId: string) {
    const room = await Room.findById(roomId);
    if (!room) {
      throw new NotFoundError("Sala não encontrada.");
    }
    return room;
  }

  private async findSessionTypeOrThrow(sessionTypeId: string) {
    const sessionType = await SessionType.findById(sessionTypeId);
    if (!sessionType) {
      throw new NotFoundError("Tipo de sessão não encontrado.");
    }
    return sessionType;
  }

  private async findSessionOrThrow(sessionId: string) {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new NotFoundError("Sessão não encontrada.");
    }
    return session;
  }

  private async ensureSessionModalitySettings() {
    const operations = (Object.keys(DEFAULT_SESSION_MODALITY_SETTINGS) as SessionModality[]).map(
      (modality) => ({
        updateOne: {
          filter: { modality },
          update: {
            $setOnInsert: {
              modality,
              ...DEFAULT_SESSION_MODALITY_SETTINGS[modality],
              isActive: true,
            },
          },
          upsert: true,
        },
      }),
    );
    await SessionModalitySetting.bulkWrite(operations);
  }

  private async getSessionModalityLimits(modality: SessionModality): Promise<SessionValidationLimits> {
    await this.ensureSessionModalitySettings();
    const setting = await SessionModalitySetting.findOne({ modality }).lean();
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
      SessionType.findById(input.sessionTypeId).lean(),
      Room.findById(input.roomId).lean(),
      Patient.countDocuments({ _id: { $in: input.patientIds }, isActive: true }),
      User.countDocuments({
        _id: { $in: input.professionalIds },
        role: { $in: USER_ROLES as unknown as UserRole[] },
        isActive: true,
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

  private applySessionUpdates(
    existing: InstanceType<typeof Session>,
    normalized: ReturnType<typeof normalizeSessionInput>,
    startAt: Date,
    endAt: Date,
    currentUser: AuthenticatedUser,
  ): void {
    existing.sessionTypeId = new mongoose.Types.ObjectId(normalized.sessionTypeId);
    existing.modality = normalized.modality;
    existing.roomId = new mongoose.Types.ObjectId(normalized.roomId);
    existing.startAt = startAt;
    existing.endAt = endAt;
    existing.durationMinutes = normalized.durationMinutes;
    existing.patientIds = normalized.patientIds.map((id) => new mongoose.Types.ObjectId(id));
    existing.professionalIds = normalized.professionalIds.map((id) => new mongoose.Types.ObjectId(id));
    existing.notes = normalized.notes;
    existing.updatedBy = currentUser._id;
  }

  private assertTechnicianCanComplete(
    session: InstanceType<typeof Session>,
    currentUser: AuthenticatedUser,
  ): void {
    const isOwnerProfessional = session.professionalIds.some(
      (professionalId) => professionalId.toString() === currentUser._id.toString(),
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
    const overlapFilter = buildSessionOverlapFilter({
      startAt: params.startAt,
      endAt: params.endAt,
      excludeSessionId: params.excludeSessionId,
    });

    const [roomConflict, professionalConflict, patientConflict] = await Promise.all([
      Session.exists({ ...overlapFilter, roomId: params.roomId }),
      Session.exists({ ...overlapFilter, professionalIds: { $in: params.professionalIds } }),
      Session.exists({ ...overlapFilter, patientIds: { $in: params.patientIds } }),
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
