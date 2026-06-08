import "dotenv/config";

const required = [
  "DATABASE_URL",
  "PORT",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
}

const cookieSameSiteRaw = (process.env.COOKIE_SAME_SITE ?? "strict").toLowerCase();
const cookieSameSiteOptions = ["strict", "lax", "none"] as const;
if (!cookieSameSiteOptions.includes(cookieSameSiteRaw as (typeof cookieSameSiteOptions)[number])) {
  throw new Error(
    `COOKIE_SAME_SITE inválido: ${process.env.COOKIE_SAME_SITE}. Use: strict, lax ou none.`,
  );
}
const cookieSameSite = cookieSameSiteRaw as (typeof cookieSameSiteOptions)[number];

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL as string,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:5173",
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  jwtCookieName: process.env.JWT_COOKIE_NAME ?? "ama_access_token",
  jwtCookieMaxAgeMs: Number(process.env.JWT_COOKIE_MAX_AGE_MS ?? 8 * 60 * 60 * 1000),
  adminName: process.env.ADMIN_NAME ?? "Administrador",
  adminEmail: process.env.ADMIN_EMAIL as string,
  adminPassword: process.env.ADMIN_PASSWORD as string,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  cookieSameSite,
  allowedEmailDomain: (process.env.ALLOWED_EMAIL_DOMAIN ?? "amaitajai.org.br")
    .trim()
    .toLowerCase()
    .replace(/^@/, ""),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback",
  googleOAuthStateCookieName: process.env.GOOGLE_OAUTH_STATE_COOKIE_NAME ?? "ama_google_oauth_state",
  get googleAuthEnabled(): boolean {
    return Boolean(this.googleClientId && this.googleClientSecret);
  },
};
