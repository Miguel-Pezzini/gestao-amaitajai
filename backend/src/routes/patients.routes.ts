import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { serializePatient, serializePatientList } from "../db/serialize.js";
import { containsInsensitive, isUuid } from "../validators/agenda/agenda.utils.js";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { agendaService } from "../services/agenda.service.js";
import { patientFundingSourceService } from "../services/patient-funding-source.service.js";
import { validatePatientDeactivationReplacements } from "../validators/patient-deactivation.validator.js";

const router = Router();

const patientInclude = {
  fundingSource: { select: { id: true, name: true } },
} as const;

interface PatientPayload {
  fullName?: unknown;
  birthDate?: unknown;
  guardianName?: unknown;
  phone?: unknown;
  fundingSourceId?: unknown;
}

interface PatientUpdateFields {
  fullName?: string;
  birthDate?: Date;
  guardianName?: string;
  phone?: string;
  fundingSourceId?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  update: PatientUpdateFields;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBirthDate(value: unknown): Date | null {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isValidAgeRange(birthDate: Date): boolean {
  const now = new Date();
  const maxPastDate = new Date();
  maxPastDate.setFullYear(now.getFullYear() - 120);
  return birthDate <= now && birthDate >= maxPastDate;
}

function normalizePhone(value: unknown): string | null {
  const digits = normalizeText(value).replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) {
    return null;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeFundingSourceId(value: unknown): string | null {
  const raw = normalizeText(value);
  return isUuid(raw) ? raw : null;
}

function validatePatientPayload(
  payload: PatientPayload,
  { partial = false }: { partial?: boolean } = {},
): ValidationResult {
  const errors: string[] = [];
  const update: PatientUpdateFields = {};

  if (!partial || payload.fullName !== undefined) {
    const fullName = normalizeText(payload.fullName);
    if (!fullName) {
      errors.push("Nome completo é obrigatório.");
    } else {
      update.fullName = fullName;
    }
  }

  if (!partial || payload.birthDate !== undefined) {
    const birthDate = parseBirthDate(payload.birthDate);
    if (!birthDate) {
      errors.push("Data de nascimento inválida.");
    } else if (!isValidAgeRange(birthDate)) {
      errors.push(
        "Data de nascimento inválida. Não pode ser futura nem superior a 120 anos.",
      );
    } else {
      update.birthDate = birthDate;
    }
  }

  if (!partial || payload.guardianName !== undefined) {
    const guardianName = normalizeText(payload.guardianName);
    if (!guardianName) {
      errors.push("Nome do responsável é obrigatório.");
    } else {
      update.guardianName = guardianName;
    }
  }

  if (!partial || payload.phone !== undefined) {
    const phone = normalizePhone(payload.phone);
    if (!phone) {
      errors.push("Telefone de contato é obrigatório.");
    } else {
      update.phone = phone;
    }
  }

  if (!partial || payload.fundingSourceId !== undefined) {
    const fundingSourceId = normalizeFundingSourceId(payload.fundingSourceId);
    if (!fundingSourceId) {
      errors.push("Fonte de custeio inválida.");
    } else {
      update.fundingSourceId = fundingSourceId;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    update,
  };
}

function buildWhere(queryParams: Request["query"]): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = {};
  const search = normalizeText(queryParams.search);

  if (search) {
    where.OR = [
      { fullName: containsInsensitive(search) },
      { guardianName: containsInsensitive(search) },
    ];
  }

  const fundingSourceId = normalizeFundingSourceId(queryParams.fundingSourceId);
  if (fundingSourceId) {
    where.fundingSourceId = fundingSourceId;
  }

  const status = normalizeText(queryParams.status).toLowerCase();
  if (status === "active") {
    where.isActive = true;
  } else if (status === "inactive") {
    where.isActive = false;
  }

  return where;
}

router.use("/patients", requireAuth);

router.get("/patients", async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const skip = (page - 1) * limit;
  const where = buildWhere(req.query);

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip,
      take: limit,
      include: {
        ...patientInclude,
        _count: {
          select: {
            protocols: {
              where: { status: "PENDENTE" },
            },
          },
        },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  res.status(200).json({
    items: serializePatientList(rows).map((patient, index) => {
      const row = rows[index] as (typeof rows)[number] & {
        _count?: { protocols: number };
      };
      return {
        ...patient,
        pendingProtocolCount: row._count?.protocols ?? 0,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.post(
  "/patients",
  asyncHandler(async (req: Request, res: Response) => {
    const { valid, errors, update } = validatePatientPayload((req.body ?? {}) as PatientPayload);

    if (!valid) {
      res.status(400).json({ message: errors[0], errors });
      return;
    }

    await patientFundingSourceService.findActiveFundingSourceOrThrow(update.fundingSourceId!);

    const created = await prisma.patient.create({
      data: {
        fullName: update.fullName!,
        birthDate: update.birthDate!,
        guardianName: update.guardianName!,
        phone: update.phone!,
        fundingSourceId: update.fundingSourceId!,
      },
      include: patientInclude,
    });

    res.status(201).json({ patient: serializePatient(created) });
  }),
);

router.get("/patients/:id", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: patientInclude,
  });
  if (!patient) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  res.status(200).json({ patient: serializePatient(patient) });
});

router.patch("/patients/:id", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const { valid, errors, update } = validatePatientPayload((req.body ?? {}) as PatientPayload, {
    partial: true,
  });
  if (!valid) {
    res.status(400).json({ message: errors[0], errors });
    return;
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ message: "Nenhum campo para atualização foi enviado." });
    return;
  }

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  if (update.fundingSourceId) {
    await patientFundingSourceService.findActiveFundingSourceOrThrow(update.fundingSourceId);
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: update,
    include: patientInclude,
  });
  res.status(200).json({ patient: serializePatient(patient) });
});

router.get(
  "/patients/:id/deactivation-impact",
  asyncHandler(async (req: Request, res: Response) => {
    const id = getRouteId(req.params.id);

    if (!isUuid(id)) {
      res.status(400).json({ message: "Identificador de paciente inválido." });
      return;
    }

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: "Paciente não encontrado." });
      return;
    }

    const impact = await agendaService.getPatientDeactivationImpact(id);
    res.status(200).json(impact);
  }),
);

router.patch(
  "/patients/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const isActive = (req.body as { isActive?: unknown })?.isActive;
  if (typeof isActive !== "boolean") {
    res.status(400).json({ message: "O campo isActive deve ser booleano." });
    return;
  }

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  let sessionImpact = { sessionsCancelled: 0, sessionsReplaced: 0 };
  if (existing.isActive && !isActive) {
    const replacements = validatePatientDeactivationReplacements(
      (req.body as { replacements?: unknown })?.replacements,
    );
    sessionImpact = await agendaService.handlePatientDeactivation(
      id,
      existing.fullName,
      req.user!,
      replacements,
    );
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: { isActive },
    include: patientInclude,
  });

  res.status(200).json({
    patient: serializePatient(patient),
    ...sessionImpact,
  });
  }),
);

export default router;
