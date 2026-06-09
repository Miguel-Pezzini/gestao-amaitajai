import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import type { UserAccountStatus } from "../domain/agenda.js";
import {
  isAllowedEmailDomain,
  normalizeEmail,
} from "../validators/auth/email-domain.validator.js";

const SALT_ROUNDS = env.bcryptSaltRounds;

interface AccessTokenPayload {
  sub: string;
}

export async function ensureInitialAdminUser(): Promise<void> {
  const adminEmail = env.adminEmail.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      name: env.adminName,
      email: adminEmail,
      passwordHash,
      role: "ADMINISTRADOR",
      accountStatus: "ATIVO",
    },
  });

  console.log(`Usuário admin inicial criado: ${adminEmail}`);
}

export type LoginFailureReason =
  | "invalid_credentials"
  | "dominio_nao_permitido"
  | "conta_inativa"
  | "senha_nao_configurada";

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  const bypassDomainCheck = env.isTest && normalizedEmail.endsWith(".test");
  if (
    !bypassDomainCheck &&
    !isAllowedEmailDomain(normalizedEmail, env.allowedEmailDomain)
  ) {
    return { user: null, reason: "dominio_nao_permitido" as const };
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return { user: null, reason: "invalid_credentials" as const };
  }

  if (user.accountStatus === "INATIVO") {
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
  const authOptions = buildAuthCookieOptions();
  return {
    ...authOptions,
    // OAuth retorna via navegação cross-site (Google → callback); strict bloqueia o cookie.
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  };
}

export function serializeAuthUser(user: {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  accountStatus: UserAccountStatus;
}) {
  const rawId = user.id ?? user._id ?? "";
  return {
    id: rawId,
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
    case "conta_inativa":
      return "Conta inativa. Entre em contato com a administração.";
    case "senha_nao_configurada":
      return "Esta conta usa login Google. Entre com Google ou peça uma senha ao administrador.";
    default:
      return "Credenciais inválidas.";
  }
}
