import { Router, type Request, type Response } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  authenticateGoogleCode,
  buildGoogleAuthUrl,
  generateOAuthState,
  GoogleAuthError,
} from "../services/google-auth.service.js";
import {
  buildAuthCookieOptions,
  buildOAuthStateCookieOptions,
  generateAccessToken,
  loginFailureMessage,
  serializeAuthUser,
  validateCredentials,
} from "../services/auth.service.js";

const router = Router();

interface LoginBody {
  email?: string;
  password?: string;
}

function buildLoginRedirect(errorCode?: string): string {
  const url = new URL("/login", env.frontendUrl);
  if (errorCode) {
    url.searchParams.set("error", errorCode);
  }
  return url.toString();
}

router.get("/auth/config", (_req: Request, res: Response) => {
  res.status(200).json({
    googleAuthEnabled: env.googleAuthEnabled,
    allowedEmailDomain: env.allowedEmailDomain,
  });
});

router.get("/auth/google", (_req: Request, res: Response) => {
  if (!env.googleAuthEnabled) {
    res.redirect(buildLoginRedirect("google_nao_configurado"));
    return;
  }

  const state = generateOAuthState();
  res.cookie(env.googleOAuthStateCookieName, state, buildOAuthStateCookieOptions());
  res.redirect(buildGoogleAuthUrl(state));
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const storedState = req.cookies?.[env.googleOAuthStateCookieName] as string | undefined;

  res.clearCookie(env.googleOAuthStateCookieName, buildOAuthStateCookieOptions());

  if (!code || !state || !storedState || state !== storedState) {
    res.redirect(buildLoginRedirect("google_auth_falhou"));
    return;
  }

  try {
    const user = await authenticateGoogleCode(code);
    const token = generateAccessToken(user._id.toString());
    res.cookie(env.jwtCookieName, token, buildAuthCookieOptions());
    res.redirect(new URL("/", env.frontendUrl).toString());
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      res.redirect(buildLoginRedirect(error.code));
      return;
    }

    console.error("Falha no callback Google:", error);
    res.redirect(buildLoginRedirect("google_auth_falhou"));
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as LoginBody;

  if (!email || !password) {
    res.status(400).json({ message: "E-mail e senha são obrigatórios." });
    return;
  }

  const { user, reason } = await validateCredentials(email, password);

  if (!user || reason) {
    res.status(401).json({
      message: loginFailureMessage(reason ?? "invalid_credentials"),
      code: reason ?? "invalid_credentials",
    });
    return;
  }

  const token = generateAccessToken(user._id.toString());
  res.cookie(env.jwtCookieName, token, buildAuthCookieOptions());

  res.status(200).json({
    user: serializeAuthUser(user),
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie(env.jwtCookieName, buildAuthCookieOptions());
  res.status(200).json({ message: "Logout realizado com sucesso." });
});

router.get("/auth/me", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user ? serializeAuthUser(req.user) : null });
});

export default router;
