import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import {
  serializePatientRef,
  serializePopulatedNameRef,
  withMongoId,
} from "../db/serialize.js";
import { PROTOCOL_MAX_SEQUENCE, PROTOCOL_STATUSES } from "../domain/protocol.js";
import type { ProtocolStatus } from "../domain/protocol.js";
import type { AuthUser } from "../types/express.js";
import { ConflictError, NotFoundError } from "../errors/http-errors.js";
import { containsInsensitive, isUuid } from "../validators/agenda/agenda.utils.js";
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

function serializeProtocol(protocol: {
  id: string;
  protocolNumber: number;
  patientId: string;
  requestType: string;
  status: string;
  notes: string;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: { id: string; fullName: string; fundingSource: string };
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}) {
  return {
    ...withMongoId(protocol),
    patient: protocol.patient ? serializePatientRef(protocol.patient) : undefined,
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
    select: { id: true, fullName: true, fundingSource: true },
  },
  createdBy: {
    select: { id: true, name: true },
  },
  updatedBy: {
    select: { id: true, name: true },
  },
} as const;

export class ProtocolService {
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

    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundError("Paciente não encontrado.");
    }

    const protocol = await prisma.$transaction(async (tx) => {
      const protocolNumber = await generateNextProtocolNumber(tx);

      return tx.patientProtocol.create({
        data: {
          protocolNumber,
          patientId: input.patientId,
          requestType: input.requestType,
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

    try {
      const protocol = await prisma.patientProtocol.update({
        where: { id: protocolId },
        data: {
          status: input.status,
          updatedById: currentUser._id,
        },
        include: protocolInclude,
      });

      return { protocol: serializeProtocol(protocol) };
    } catch {
      throw new NotFoundError("Protocolo não encontrado.");
    }
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
}

export const protocolService = new ProtocolService();
