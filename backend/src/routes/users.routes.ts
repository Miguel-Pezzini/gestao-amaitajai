import { Router, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { withMongoId, withMongoIdList } from "../db/serialize.js";
import {
  USER_ACCOUNT_STATUSES,
  USER_ROLES,
  type UserAccountStatus,
  type UserRole,
} from "../domain/agenda.js";
import { containsInsensitive, isUuid } from "../validators/agenda/agenda.utils.js";
import { isAllowedEmailDomain } from "../validators/auth/email-domain.validator.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeRole(value: unknown): UserRole | null {
  const role = normalizeText(value).toLowerCase();
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : null;
}

function normalizeAccountStatus(value: unknown): UserAccountStatus | null {
  const status = normalizeText(value).toLowerCase();
  return USER_ACCOUNT_STATUSES.includes(status as UserAccountStatus)
    ? (status as UserAccountStatus)
    : null;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

interface UserPayload {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
}

interface UserUpdateFields {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  update: UserUpdateFields;
}

function validateUserPayload(
  payload: UserPayload,
  { partial = false, requirePassword = false }: { partial?: boolean; requirePassword?: boolean } = {},
): ValidationResult {
  const errors: string[] = [];
  const update: UserUpdateFields = {};

  if (!partial || payload.name !== undefined) {
    const name = normalizeText(payload.name);
    if (!name) {
      errors.push("Nome é obrigatório.");
    } else {
      update.name = name;
    }
  }

  if (!partial || payload.email !== undefined) {
    const email = normalizeEmail(payload.email);
    if (!email || !email.includes("@")) {
      errors.push("E-mail inválido.");
    } else if (!isAllowedEmailDomain(email, env.allowedEmailDomain)) {
      errors.push(`Use um e-mail institucional @${env.allowedEmailDomain}.`);
    } else {
      update.email = email;
    }
  }

  if (!partial || payload.role !== undefined) {
    const role = normalizeRole(payload.role);
    if (!role) {
      errors.push("Perfil inválido. Valores permitidos: administrador, tecnico.");
    } else {
      update.role = role;
    }
  }

  const shouldValidatePassword =
    requirePassword || (!partial && payload.password !== undefined) || payload.password !== undefined;

  if (shouldValidatePassword) {
    const password = normalizeText(payload.password);
    if (!password || password.length < 6) {
      errors.push("Senha obrigatória com no mínimo 6 caracteres.");
    } else {
      update.passwordHash = password;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    update,
  };
}

function buildWhere(queryParams: Request["query"]): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  const search = normalizeText(queryParams.search);

  if (search) {
    where.OR = [{ name: containsInsensitive(search) }, { email: containsInsensitive(search) }];
  }

  const role = normalizeRole(queryParams.role);
  if (role) {
    where.role = role;
  }

  const status = normalizeText(queryParams.status).toLowerCase();
  if (status === "active") {
    where.accountStatus = "ativo";
  } else if (status === "inactive") {
    where.accountStatus = "inativo";
  } else if (status === "pending") {
    where.accountStatus = "pendente";
  }

  return where;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.use("/users", requireAuth, requireAdmin);

router.get("/users/pending-count", async (_req: Request, res: Response) => {
  const total = await prisma.user.count({ where: { accountStatus: "pendente" } });
  res.status(200).json({ total });
});

router.get("/users", async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 50), 100);
  const skip = (page - 1) * limit;
  const where = buildWhere(req.query);

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    items: withMongoIdList(rows),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

router.post("/users", async (req: Request, res: Response) => {
  const { valid, errors, update } = validateUserPayload((req.body ?? {}) as UserPayload, {
    requirePassword: true,
  });

  if (!valid) {
    res.status(400).json({ message: errors[0], errors });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: update.email } });
  if (existing) {
    res.status(409).json({ message: "Já existe um funcionário com este e-mail." });
    return;
  }

  const passwordHash = await bcrypt.hash(update.passwordHash!, env.bcryptSaltRounds);
  const created = await prisma.user.create({
    data: {
      name: update.name!,
      email: update.email!,
      role: update.role ?? "tecnico",
      passwordHash,
      accountStatus: "ativo",
    },
    select: userSelect,
  });

  res.status(201).json({ user: withMongoId(created) });
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Identificador de funcionário inválido." });
    return;
  }

  const { valid, errors, update } = validateUserPayload((req.body ?? {}) as UserPayload, {
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

  if (update.email) {
    const duplicate = await prisma.user.findFirst({
      where: {
        email: update.email,
        id: { not: id },
      },
    });
    if (duplicate) {
      res.status(409).json({ message: "Já existe um funcionário com este e-mail." });
      return;
    }
  }

  const data: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
  } = {
    name: update.name,
    email: update.email,
    role: update.role,
  };

  if (update.passwordHash) {
    data.passwordHash = await bcrypt.hash(update.passwordHash, env.bcryptSaltRounds);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    res.status(200).json({ user: withMongoId(user) });
  } catch {
    res.status(404).json({ message: "Funcionário não encontrado." });
  }
});

router.patch("/users/:id/status", async (req: Request, res: Response) => {
  const id = getRouteId(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Identificador de funcionário inválido." });
    return;
  }

  const accountStatus = normalizeAccountStatus((req.body as { accountStatus?: unknown })?.accountStatus);
  if (!accountStatus || accountStatus === "pendente") {
    res.status(400).json({
      message: "O campo accountStatus deve ser 'ativo' ou 'inativo'.",
    });
    return;
  }

  if (req.user?._id === id && accountStatus === "inativo") {
    res.status(400).json({ message: "Você não pode inativar sua própria conta." });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { accountStatus },
      select: userSelect,
    });
    res.status(200).json({ user: withMongoId(user) });
  } catch {
    res.status(404).json({ message: "Funcionário não encontrado." });
  }
});

export default router;
