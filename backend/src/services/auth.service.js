import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";

const SALT_ROUNDS = 12;

export async function ensureInitialAdminUser() {
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

export async function validateCredentials(email, password) {
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

export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function buildAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    path: "/api",
    maxAge: env.jwtCookieMaxAgeMs,
  };
}
