import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env.js";

const DEFAULT_MESSAGE = "Muitas tentativas de login. Tente novamente mais tarde.";

export function createLoginRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: env.loginRateLimitWindowMs,
    max: env.loginRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, res) => {
      res.status(429).json({ message: DEFAULT_MESSAGE });
    },
    ...overrides,
  });
}

export const loginRateLimiter = createLoginRateLimiter();
