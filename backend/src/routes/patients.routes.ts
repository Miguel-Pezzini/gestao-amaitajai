import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  FUNDING_SOURCES,
  Patient,
  type FundingSource,
} from "../models/patient.model.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

interface PatientPayload {
  fullName?: unknown;
  birthDate?: unknown;
  guardianName?: unknown;
  phone?: unknown;
  fundingSource?: unknown;
}

interface PatientUpdateFields {
  fullName?: string;
  birthDate?: Date;
  guardianName?: string;
  phone?: string;
  fundingSource?: FundingSource;
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

function normalizeFundingSource(value: unknown): FundingSource | null {
  const raw = normalizeText(value);
  const found = FUNDING_SOURCES.find(
    (item) => item.toLowerCase() === raw.toLowerCase(),
  );
  return found ?? null;
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

  if (!partial || payload.fundingSource !== undefined) {
    const fundingSource = normalizeFundingSource(payload.fundingSource);
    if (!fundingSource) {
      errors.push(
        `Fonte de custeio inválida. Valores permitidos: ${FUNDING_SOURCES.join(", ")}.`,
      );
    } else {
      update.fundingSource = fundingSource;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    update,
  };
}

function buildFilters(queryParams: Request["query"]): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  const search = normalizeText(queryParams.search);

  if (search) {
    filters.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { guardianName: { $regex: search, $options: "i" } },
    ];
  }

  const fundingSource = normalizeFundingSource(queryParams.fundingSource);
  if (fundingSource) {
    filters.fundingSource = fundingSource;
  }

  const status = normalizeText(queryParams.status).toLowerCase();
  if (status === "active") {
    filters.isActive = true;
  } else if (status === "inactive") {
    filters.isActive = false;
  }

  return filters;
}

router.use("/patients", requireAuth);

router.get("/patients", async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
  const skip = (page - 1) * limit;
  const filters = buildFilters(req.query);

  const [items, total] = await Promise.all([
    Patient.find(filters).sort({ fullName: 1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filters),
  ]);

  res.status(200).json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.post("/patients", async (req: Request, res: Response) => {
  const { valid, errors, update } = validatePatientPayload(
    (req.body ?? {}) as PatientPayload,
  );

  if (!valid) {
    res.status(400).json({ message: errors[0], errors });
    return;
  }

  const created = await Patient.create(update);
  res.status(201).json({ patient: created });
});

router.get("/patients/:id", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const patient = await Patient.findById(id).lean();
  if (!patient) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  res.status(200).json({ patient });
});

router.patch("/patients/:id", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const { valid, errors, update } = validatePatientPayload(
    (req.body ?? {}) as PatientPayload,
    { partial: true },
  );
  if (!valid) {
    res.status(400).json({ message: errors[0], errors });
    return;
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ message: "Nenhum campo para atualização foi enviado." });
    return;
  }

  const patient = await Patient.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!patient) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  res.status(200).json({ patient });
});

router.patch("/patients/:id/status", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Identificador de paciente inválido." });
    return;
  }

  const isActive = (req.body as { isActive?: unknown })?.isActive;
  if (typeof isActive !== "boolean") {
    res.status(400).json({ message: "O campo isActive deve ser booleano." });
    return;
  }

  const patient = await Patient.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true },
  ).lean();

  if (!patient) {
    res.status(404).json({ message: "Paciente não encontrado." });
    return;
  }

  res.status(200).json({ patient });
});

export default router;
