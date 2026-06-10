import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { isPrismaUniqueViolation } from "../db/errors.js";
import {
  serializePatientRef,
  serializePopulatedNameRef,
  withMongoId,
  withMongoIdList,
} from "../db/serialize.js";
import { PROTOCOL_MAX_SEQUENCE, PROTOCOL_STATUSES } from "../domain/protocol.js";
import type { ProtocolStatus } from "../domain/protocol.js";
import type { AuthUser } from "../types/express.js";
import { ConflictError, NotFoundError, ValidationError } from "../errors/http-errors.js";
import { containsInsensitive, isUuid } from "../validators/agenda/agenda.utils.js";
import {
  validateCreateProtocolType,
  validateIsActive,
  validateProtocolTypeId,
  validateUpdateProtocolType,
} from "../validators/protocol/protocol-type.validator.js";
import {
  validateCreateProtocol,
  validateUpdateProtocolStatus,
} from "../validators/protocol/protocol.validator.js";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCurrentYearBase(): number {
  return new Date().getFullYear() * 100_000;
}

async function generateNextProtocolNumber(
  tx: Prisma.TransactionClient,
): Promise<number> {
  const yearBase = getCurrentYearBase();
  const yearMax = yearBase + PROTOCOL_MAX_SEQUENCE;

  const latest = await tx.patientProtocol.findFirst({
    where: {
      protocolNumber: {
        gte: yearBase,
        lte: yearMax,
      },
    },
    orderBy: { protocolNumber: "desc" },
    select: { protocolNumber: true },
  });

  const nextSequence = latest ? latest.protocolNumber - yearBase + 1 : 1;
  if (nextSequence > PROTOCOL_MAX_SEQUENCE) {
    throw new ConflictError(
      `Limite anual de protocolos atingido para ${new Date().getFullYear()}.`,
    );
  }

  return yearBase + nextSequence;
}

function serializeProtocolType(protocolType: {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return withMongoId(protocolType);
}

function serializeProtocol(protocol: {
  id: string;
  protocolNumber: number;
  patientId: string;
  protocolTypeId: string;
  status: string;
  notes: string;
  completedAt: Date | null;
  cancelReason: string;
  cancelledAt: Date | null;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: { id: string; fullName: string; fundingSource: { id: string; name: string } };
  protocolType?: { id: string; name: string; isActive: boolean; createdAt: Date; updatedAt: Date };
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}) {
  return {
    ...withMongoId(protocol),
    patient: protocol.patient ? serializePatientRef(protocol.patient) : undefined,
    protocolType: protocol.protocolType
      ? serializeProtocolType(protocol.protocolType)
      : undefined,
    createdBy: serializePopulatedNameRef(protocol.createdBy ?? null),
    updatedBy: serializePopulatedNameRef(protocol.updatedBy ?? null),
  };
}

function buildWhere(query: Record<string, unknown>): Prisma.PatientProtocolWhereInput {
  const where: Prisma.PatientProtocolWhereInput = {};
  const search = normalizeText(query.search);
  const patientId = normalizeText(query.patientId);
  const status = normalizeText(query.status).toUpperCase();

  if (patientId) {
    if (isUuid(patientId)) {
      where.patientId = patientId;
    }
  }

  if (status && PROTOCOL_STATUSES.includes(status as ProtocolStatus)) {
    where.status = status as Prisma.EnumProtocolStatusFilter;
  }

  if (search) {
    const protocolNumber = Number.parseInt(search, 10);
    where.OR = [
      { patient: { fullName: containsInsensitive(search) } },
      { patient: { guardianName: containsInsensitive(search) } },
      ...(Number.isFinite(protocolNumber) ? [{ protocolNumber }] : []),
    ];
  }

  return where;
}

const protocolInclude = {
  patient: {
    select: { id: true, fullName: true, fundingSource: { select: { id: true, name: true } } },
  },
  protocolType: {
    select: { id: true, name: true, isActive: true, createdAt: true, updatedAt: true },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  updatedBy: {
    select: { id: true, name: true },
  },
} as const;

export class ProtocolService {
  async listProtocolTypes() {
    const items = await prisma.protocolType.findMany({ orderBy: { name: "asc" } });
    return { items: withMongoIdList(items) };
  }

  async createProtocolType(payload: { name?: unknown }) {
    const { name } = validateCreateProtocolType(payload);

    try {
      const protocolType = await prisma.protocolType.create({ data: { name } });
      return { protocolType: serializeProtocolType(protocolType) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe um tipo de protocolo com este nome.");
      }
      throw error;
    }
  }

  async updateProtocolType(protocolTypeId: string, payload: { name?: unknown }) {
    const updates = validateUpdateProtocolType(protocolTypeId, payload);
    await this.findProtocolTypeOrThrow(protocolTypeId);

    if (!updates.name) {
      const protocolType = await prisma.protocolType.findUniqueOrThrow({
        where: { id: protocolTypeId },
      });
      return { protocolType: serializeProtocolType(protocolType) };
    }

    try {
      const protocolType = await prisma.protocolType.update({
        where: { id: protocolTypeId },
        data: { name: updates.name },
      });
      return { protocolType: serializeProtocolType(protocolType) };
    } catch (error) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictError("Já existe um tipo de protocolo com este nome.");
      }
      throw error;
    }
  }

  async updateProtocolTypeStatus(protocolTypeId: string, isActive: boolean) {
    validateProtocolTypeId(protocolTypeId);
    validateIsActive(isActive);

    try {
      const protocolType = await prisma.protocolType.update({
        where: { id: protocolTypeId },
        data: { isActive },
      });
      return { protocolType: serializeProtocolType(protocolType) };
    } catch {
      throw new NotFoundError("Tipo de protocolo não encontrado.");
    }
  }

  async listProtocols(query: Record<string, unknown>) {
    const page = parsePositiveInt(query.page, 1);
    const limit = Math.min(parsePositiveInt(query.limit, 20), 100);
    const skip = (page - 1) * limit;
    const where = buildWhere(query);

    const [rows, total] = await Promise.all([
      prisma.patientProtocol.findMany({
        where,
        include: protocolInclude,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.patientProtocol.count({ where }),
    ]);

    return {
      items: rows.map(serializeProtocol),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getProtocol(protocolId: string) {
    if (!isUuid(protocolId)) {
      throw new NotFoundError("Protocolo não encontrado.");
    }

    const protocol = await prisma.patientProtocol.findUnique({
      where: { id: protocolId },
      include: protocolInclude,
    });

    if (!protocol) {
      throw new NotFoundError("Protocolo não encontrado.");
    }

    return { protocol: serializeProtocol(protocol) };
  }

  async createProtocol(payload: Record<string, unknown>, currentUser: AuthUser) {
    const input = validateCreateProtocol(payload);

    const [patient, protocolType] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: input.patientId },
        select: { id: true },
      }),
      prisma.protocolType.findUnique({
        where: { id: input.protocolTypeId },
        select: { id: true, isActive: true },
      }),
    ]);

    if (!patient) {
      throw new NotFoundError("Paciente não encontrado.");
    }
    if (!protocolType) {
      throw new NotFoundError("Tipo de protocolo não encontrado.");
    }
    if (!protocolType.isActive) {
      throw new ValidationError("Tipo de protocolo inativo não pode ser usado.");
    }

    const protocol = await prisma.$transaction(async (tx) => {
      const protocolNumber = await generateNextProtocolNumber(tx);

      return tx.patientProtocol.create({
        data: {
          protocolNumber,
          patientId: input.patientId,
          protocolTypeId: input.protocolTypeId,
          notes: input.notes,
          createdById: currentUser._id,
          updatedById: currentUser._id,
        },
        include: protocolInclude,
      });
    });

    return { protocol: serializeProtocol(protocol) };
  }

  async updateProtocolStatus(
    protocolId: string,
    payload: Record<string, unknown>,
    currentUser: AuthUser,
  ) {
    if (!isUuid(protocolId)) {
      throw new NotFoundError("Protocolo não encontrado.");
    }

    const input = validateUpdateProtocolStatus(payload);

    const existing = await prisma.patientProtocol.findUnique({
      where: { id: protocolId },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundError("Protocolo não encontrado.");
    }

    if (existing.status !== "PENDENTE") {
      throw new ValidationError("Só é possível alterar protocolos pendentes.");
    }

    const now = new Date();
    const data = {
      status: input.status,
      updatedById: currentUser._id,
      ...(input.status === "CONCLUIDO" ? { completedAt: now } : {}),
      ...(input.status === "CANCELADO"
        ? { cancelReason: input.cancelReason, cancelledAt: now }
        : {}),
    };

    const protocol = await prisma.patientProtocol.update({
      where: { id: protocolId },
      data,
      include: protocolInclude,
    });

    return { protocol: serializeProtocol(protocol) };
  }

  async listProtocolsByPatient(patientId: string) {
    if (!isUuid(patientId)) {
      throw new NotFoundError("Paciente não encontrado.");
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundError("Paciente não encontrado.");
    }

    const rows = await prisma.patientProtocol.findMany({
      where: { patientId },
      include: protocolInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return { items: rows.map(serializeProtocol) };
  }

  private async findProtocolTypeOrThrow(protocolTypeId: string) {
    const protocolType = await prisma.protocolType.findUnique({
      where: { id: protocolTypeId },
    });
    if (!protocolType) {
      throw new NotFoundError("Tipo de protocolo não encontrado.");
    }
    return protocolType;
  }
}

export const protocolService = new ProtocolService();
