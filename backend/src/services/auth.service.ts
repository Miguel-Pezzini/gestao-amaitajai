import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

const SALT_ROUNDS = 12;

interface AccessTokenPayload {
  sub: string;
}

export async function ensureInitialAdminUser(): Promise<void> {
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
  });

  console.log(`Usuário admin inicial criado: ${adminEmail}`);
}

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return null;
  }

  return user;
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
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    path: "/api",
    maxAge: env.jwtCookieMaxAgeMs,
  };
}
