import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import { Patient } from "../models/patient.model.js";
import { Room } from "../models/room.model.js";
import { Session } from "../models/session.model.js";
import {
  SESSION_MODALITIES,
  SessionType,
  type SessionModality,
} from "../models/session-type.model.js";
import { USER_ROLES, type UserRole, User } from "../models/user.model.js";
import type { Types } from "mongoose";

type AuthenticatedUser = {
  _id: Types.ObjectId;
  role: UserRole;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function parseDate(value: unknown): Date | null {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseUniqueIdArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function isObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseLimit(value: unknown, fallback = 10, max = 30): number {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

type SessionPayload = {
  sessionTypeId?: unknown;
  modality?: unknown;
  roomId?: unknown;
  startAt?: unknown;
  durationMinutes?: unknown;
  patientIds?: unknown;
  professionalIds?: unknown;
  notes?: unknown;
};

export class AgendaService {
  async searchPatients(query: { q?: unknown; limit?: unknown }) {
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

  async searchProfessionals(query: { q?: unknown; limit?: unknown }) {
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

  async listRooms() {
    const items = await Room.find().sort({ name: 1 }).lean();
    return { items };
  }

  async createRoom(payload: { name?: unknown; code?: unknown }) {
    const name = normalizeText(payload.name);
    const code = normalizeText(payload.code);

    if (!name) {
      throw new AppError(400, "Nome da sala é obrigatório.");
    }

    const room = await Room.create({ name, code: code || null });
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
    const name = normalizeText(payload.name);
    const slug = normalizeText(payload.slug).toLowerCase();
    const defaultDurationMinutes = Number.parseInt(String(payload.defaultDurationMinutes), 10);
    const isDurationFlexible = Boolean(payload.isDurationFlexible);
    const allowedModalities = parseUniqueIdArray(payload.allowedModalities).filter((item) =>
      SESSION_MODALITIES.includes(item as SessionModality),
    ) as SessionModality[];

    if (!name || !slug || !Number.isFinite(defaultDurationMinutes) || defaultDurationMinutes <= 0) {
      throw new AppError(400, "Dados inválidos para tipo de sessão.");
    }
    if (allowedModalities.length === 0) {
      throw new AppError(400, "Informe ao menos uma modalidade permitida.");
    }
    if (slug === "tea-14-plus" && allowedModalities.some((item) => item !== "grupo")) {
      throw new AppError(400, "Tipo tea-14-plus permite apenas modalidade grupo.");
    }

    const sessionType = await SessionType.create({
      name,
      slug,
      defaultDurationMinutes,
      isDurationFlexible,
      allowedModalities,
    });

    return { sessionType };
  }

  async listSessions(query: Record<string, unknown>, currentUser: AuthenticatedUser) {
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
    if (professionalId && isObjectId(professionalId) && currentUser.role === "administrador") {
      filter.professionalIds = professionalId;
    }

    if (currentUser.role === "tecnico") {
      filter.professionalIds = currentUser._id;
    }

    const items = await Session.find(filter)
      .sort({ startAt: 1 })
      .populate("sessionTypeId", "name slug")
      .populate("roomId", "name code")
      .populate("patientIds", "fullName fundingSource")
      .populate("professionalIds", "name email role")
      .lean();

    return { items };
  }

  async createSession(payload: SessionPayload, currentUser: AuthenticatedUser) {
    const normalized = this.normalizeSessionInput(payload);
    this.validateSessionInput(normalized);
    const startAt = normalized.startAt as Date;

    const references = await this.validateReferences(normalized);
    this.ensureSessionTypeSupportsModality(references.sessionType.allowedModalities, normalized.modality);

    const endAt = new Date(startAt.getTime() + normalized.durationMinutes * 60 * 1000);
    await this.ensureNoConflicts({
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
    if (!isObjectId(sessionId)) {
      throw new AppError(400, "Identificador de sessão inválido.");
    }

    const existing = await Session.findById(sessionId);
    if (!existing) {
      throw new AppError(404, "Sessão não encontrada.");
    }
    if (existing.status === "cancelada") {
      throw new AppError(400, "Sessão cancelada não pode ser editada.");
    }

    const normalized = this.normalizeSessionInput(payload, {
      sessionTypeId: existing.sessionTypeId.toString(),
      modality: existing.modality as SessionModality,
      roomId: existing.roomId.toString(),
      startAt: existing.startAt,
      durationMinutes: existing.durationMinutes,
      patientIds: existing.patientIds.map((id) => id.toString()),
      professionalIds: existing.professionalIds.map((id) => id.toString()),
      notes: existing.notes,
    });
    this.validateSessionInput(normalized);
    const startAt = normalized.startAt as Date;

    const references = await this.validateReferences(normalized);
    this.ensureSessionTypeSupportsModality(references.sessionType.allowedModalities, normalized.modality);

    const endAt = new Date(startAt.getTime() + normalized.durationMinutes * 60 * 1000);
    await this.ensureNoConflicts({
      startAt,
      endAt,
      roomId: normalized.roomId,
      patientIds: normalized.patientIds,
      professionalIds: normalized.professionalIds,
      excludeSessionId: sessionId,
    });

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

    await existing.save();
    return { session: existing };
  }

  async cancelSession(
    sessionId: string,
    payload: { cancelReason?: unknown },
    currentUser: AuthenticatedUser,
  ) {
    if (!isObjectId(sessionId)) {
      throw new AppError(400, "Identificador de sessão inválido.");
    }

    const cancelReason = normalizeText(payload.cancelReason);
    if (!cancelReason) {
      throw new AppError(400, "Motivo do cancelamento é obrigatório.");
    }

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
      throw new AppError(404, "Sessão não encontrada.");
    }

    return { session };
  }

  async completeSession(sessionId: string, currentUser: AuthenticatedUser) {
    if (!isObjectId(sessionId)) {
      throw new AppError(400, "Identificador de sessão inválido.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new AppError(404, "Sessão não encontrada.");
    }
    if (session.status === "cancelada") {
      throw new AppError(400, "Sessão cancelada não pode ser marcada como realizada.");
    }

    const isOwnerProfessional = session.professionalIds.some(
      (professionalId) => professionalId.toString() === currentUser._id.toString(),
    );
    if (currentUser.role === "tecnico" && !isOwnerProfessional) {
      throw new AppError(403, "Técnico só pode concluir a própria sessão.");
    }

    session.status = "realizada";
    session.updatedBy = currentUser._id;
    await session.save();

    return { session };
  }

  private normalizeSessionInput(payload: SessionPayload, fallback?: {
    sessionTypeId: string;
    modality: SessionModality;
    roomId: string;
    startAt: Date;
    durationMinutes: number;
    patientIds: string[];
    professionalIds: string[];
    notes: string;
  }) {
    const sessionTypeId = normalizeText(payload.sessionTypeId) || fallback?.sessionTypeId || "";
    const modality = (normalizeText(payload.modality) || fallback?.modality || "") as SessionModality;
    const roomId = normalizeText(payload.roomId) || fallback?.roomId || "";
    const startAt = parseDate(payload.startAt) ?? fallback?.startAt ?? null;
    const durationMinutes =
      Number.parseInt(String(payload.durationMinutes), 10) || fallback?.durationMinutes || 0;
    const patientIds = parseUniqueIdArray(payload.patientIds);
    const professionalIds = parseUniqueIdArray(payload.professionalIds);
    const notes = payload.notes === undefined ? (fallback?.notes ?? "") : normalizeText(payload.notes);

    return {
      sessionTypeId,
      modality,
      roomId,
      startAt,
      durationMinutes,
      patientIds: patientIds.length > 0 ? patientIds : (fallback?.patientIds ?? []),
      professionalIds: professionalIds.length > 0 ? professionalIds : (fallback?.professionalIds ?? []),
      notes,
    };
  }

  private validateSessionInput(input: ReturnType<AgendaService["normalizeSessionInput"]>) {
    if (
      !isObjectId(input.sessionTypeId) ||
      !SESSION_MODALITIES.includes(input.modality) ||
      !isObjectId(input.roomId) ||
      !input.startAt ||
      !Number.isFinite(input.durationMinutes) ||
      input.durationMinutes <= 0 ||
      input.patientIds.length === 0 ||
      input.professionalIds.length === 0
    ) {
      throw new AppError(400, "Dados obrigatórios da sessão estão inválidos.");
    }

    if (
      !input.patientIds.every((id) => isObjectId(id)) ||
      !input.professionalIds.every((id) => isObjectId(id))
    ) {
      throw new AppError(400, "IDs de paciente/profissional inválidos.");
    }
  }

  private async validateReferences(input: ReturnType<AgendaService["normalizeSessionInput"]>) {
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
      throw new AppError(400, "Tipo de sessão inválido ou inativo.");
    }
    if (!room || !room.isActive) {
      throw new AppError(400, "Sala inválida ou inativa.");
    }
    if (patientsCount !== input.patientIds.length) {
      throw new AppError(400, "Um ou mais pacientes não existem ou estão inativos.");
    }
    if (professionalsCount !== input.professionalIds.length) {
      throw new AppError(400, "Um ou mais profissionais não existem ou estão inativos.");
    }

    return { sessionType, room };
  }

  private ensureSessionTypeSupportsModality(
    allowedModalities: SessionModality[],
    modality: SessionModality,
  ) {
    if (!allowedModalities.includes(modality)) {
      throw new AppError(400, "Modalidade não permitida para este tipo de sessão.");
    }
  }

  private async ensureNoConflicts(params: {
    startAt: Date;
    endAt: Date;
    roomId: string;
    patientIds: string[];
    professionalIds: string[];
    excludeSessionId?: string;
  }) {
    const overlapFilter: Record<string, unknown> = {
      status: { $ne: "cancelada" },
      startAt: { $lt: params.endAt },
      endAt: { $gt: params.startAt },
    };
    if (params.excludeSessionId) {
      overlapFilter._id = { $ne: params.excludeSessionId };
    }

    const [roomConflict, professionalConflict, patientConflict] = await Promise.all([
      Session.exists({ ...overlapFilter, roomId: params.roomId }),
      Session.exists({ ...overlapFilter, professionalIds: { $in: params.professionalIds } }),
      Session.exists({ ...overlapFilter, patientIds: { $in: params.patientIds } }),
    ]);

    if (roomConflict) {
      throw new AppError(409, "Conflito de agenda: sala já ocupada no período.");
    }
    if (professionalConflict) {
      throw new AppError(409, "Conflito de agenda: profissional com sobreposição no período.");
    }
    if (patientConflict) {
      throw new AppError(409, "Conflito de agenda: paciente com sobreposição no período.");
    }
  }
}

export const agendaService = new AgendaService();
