import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import {
  assertAllowedEmailDomain,
  formatGoogleDisplayName,
  normalizeEmail,
} from "../validators/auth/email-domain.validator.js";

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  hostedDomain?: string | null;
}

export class GoogleAuthError extends Error {
  constructor(
    readonly code: "dominio_nao_permitido" | "conta_inativa" | "oauth_nao_configurado",
    message?: string,
  ) {
    super(message ?? code);
    this.name = "GoogleAuthError";
  }
}

function createOAuthClient(): OAuth2Client {
  if (!env.googleAuthEnabled) {
    throw new GoogleAuthError("oauth_nao_configurado", "Login Google não configurado.");
  }

  return new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildGoogleAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
}

export async function exchangeCodeForGoogleProfile(code: string): Promise<GoogleUserProfile> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Token Google inválido.");
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  const email = normalizeEmail(payload?.email);
  const googleId = payload?.sub;
  const name = String(payload?.name ?? "").trim();
  const hostedDomain = payload?.hd ?? null;

  if (!email || !googleId) {
    throw new Error("Perfil Google incompleto.");
  }

  return {
    googleId,
    email,
    name,
    hostedDomain,
  };
}

export function validateGoogleProfile(profile: GoogleUserProfile): void {
  assertAllowedEmailDomain(profile.email, env.allowedEmailDomain);

  if (profile.hostedDomain && profile.hostedDomain !== env.allowedEmailDomain) {
    throw new GoogleAuthError("dominio_nao_permitido");
  }
}

export async function findOrProvisionGoogleUser(profile: GoogleUserProfile) {
  validateGoogleProfile(profile);

  const normalizedEmail = normalizeEmail(profile.email);
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { googleId: profile.googleId }],
    },
  });

  if (existingUser) {
    const needsGoogleId = !existingUser.googleId;
    const needsEmail = existingUser.email !== normalizedEmail;
    const needsActivation = existingUser.accountStatus === "PENDENTE";

    if (needsGoogleId || needsEmail || needsActivation) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...(needsGoogleId ? { googleId: profile.googleId } : {}),
          ...(needsEmail ? { email: normalizedEmail } : {}),
          ...(needsActivation ? { accountStatus: "ATIVO" } : {}),
        },
      });
    }

    return existingUser;
  }

  return prisma.user.create({
    data: {
      name: formatGoogleDisplayName(profile.name),
      email: normalizedEmail,
      googleId: profile.googleId,
      role: "TECNICO",
      accountStatus: "ATIVO",
      passwordHash: null,
    },
  });
}

export function assertUserCanAuthenticate(user: { accountStatus: string }): void {
  if (user.accountStatus === "INATIVO") {
    throw new GoogleAuthError("conta_inativa");
  }
}

export async function authenticateGoogleCode(code: string) {
  const profile = await exchangeCodeForGoogleProfile(code);
  const user = await findOrProvisionGoogleUser(profile);
  assertUserCanAuthenticate(user);
  return user;
}
