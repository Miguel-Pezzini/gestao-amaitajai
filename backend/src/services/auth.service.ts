import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import {
  isAllowedEmailDomain,
  normalizeEmail,
} from "../validators/auth/email-domain.validator.js";

const SALT_ROUNDS = env.bcryptSaltRounds;

interface AccessTokenPayload {
  sub: string;
}

export async function migrateLegacyUserStatuses(): Promise<void> {
  await User.updateMany(
    {
      accountStatus: { $exists: false },
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    },
    { $set: { accountStatus: "ativo" }, $unset: { isActive: "" } },
  );

  await User.updateMany(
    { accountStatus: { $exists: false }, isActive: false },
    { $set: { accountStatus: "inativo" }, $unset: { isActive: "" } },
  );
}

export async function ensureInitialAdminUser(): Promise<void> {
  await migrateLegacyUserStatuses();

  const adminEmail = env.adminEmail.toLowerCase().trim();
  const existingUser = await User.findOne({ email: adminEmail }).lean();

  if (existingUser) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, SALT_ROUNDS);

  await User.create({
    name: env.adminName,
    email: adminEmail,
    passwordHash,
    role: "administrador",
    accountStatus: "ativo",
  });

  console.log(`Usuário admin inicial criado: ${adminEmail}`);
}

export type LoginFailureReason =
  | "invalid_credentials"
  | "dominio_nao_permitido"
  | "conta_pendente"
  | "conta_inativa"
  | "senha_nao_configurada";

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!isAllowedEmailDomain(normalizedEmail, env.allowedEmailDomain)) {
    return { user: null, reason: "dominio_nao_permitido" as const };
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { user: null, reason: "invalid_credentials" as const };
  }

  if (user.accountStatus === "pendente") {
    return { user: null, reason: "conta_pendente" as const };
  }

  if (user.accountStatus === "inativo") {
    return { user: null, reason: "conta_inativa" as const };
  }

  if (!user.passwordHash) {
    return { user: null, reason: "senha_nao_configurada" as const };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { user: null, reason: "invalid_credentials" as const };
  }

  return { user, reason: null };
}

export function generateAccessToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret);

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Token inválido.");
  }

  return { sub: String(payload.sub) };
}

export function buildAuthCookieOptions(): CookieOptions {
  const sameSite = env.cookieSameSite;
  return {
    httpOnly: true,
    secure: env.isProduction || sameSite === "none",
    sameSite,
    path: "/api",
    maxAge: env.jwtCookieMaxAgeMs,
  };
}

export function buildOAuthStateCookieOptions(): CookieOptions {
  return {
    ...buildAuthCookieOptions(),
    maxAge: 10 * 60 * 1000,
  };
}

export function serializeAuthUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: string;
  accountStatus: string;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

export function loginFailureMessage(reason: LoginFailureReason): string {
  switch (reason) {
    case "dominio_nao_permitido":
      return `Use seu e-mail institucional @${env.allowedEmailDomain}.`;
    case "conta_pendente":
      return "Sua conta aguarda ativação pelo administrador.";
    case "conta_inativa":
      return "Conta inativa. Entre em contato com a administração.";
    case "senha_nao_configurada":
      return "Esta conta usa login Google. Entre com Google ou peça uma senha ao administrador.";
    default:
      return "Credenciais inválidas.";
  }
}
