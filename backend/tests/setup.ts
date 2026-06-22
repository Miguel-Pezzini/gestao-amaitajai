process.env.NODE_ENV = "test";

import "dotenv/config";

const requiredTestEnv = [
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "TEST_DATABASE_URL",
] as const;

for (const key of requiredTestEnv) {
  if (!process.env[key]) {
    throw new Error(`Variável obrigatória para testes ausente: ${key}`);
  }
}

process.env.BCRYPT_SALT_ROUNDS = process.env.TEST_BCRYPT_SALT_ROUNDS ?? "4";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL as string;
// Integração assume cookie de sessão (supertest); evita AUTH_TRANSPORT=bearer do ambiente.
process.env.AUTH_TRANSPORT = "cookie";
