import { Router, type Request, type Response } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  buildAuthCookieOptions,
  generateAccessToken,
  validateCredentials,
} from "../services/auth.service.js";

const router = Router();

interface LoginBody {
  email?: string;
  password?: string;
}

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as LoginBody;

  if (!email || !password) {
    res.status(400).json({ message: "E-mail e senha são obrigatórios." });
    return;
  }

  const user = await validateCredentials(email, password);

  if (!user) {
    res.status(401).json({ message: "Credenciais inválidas." });
    return;
  }

  const token = generateAccessToken(user.id);
  res.cookie(env.jwtCookieName, token, buildAuthCookieOptions());

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie(env.jwtCookieName, buildAuthCookieOptions());
  res.status(200).json({ message: "Logout realizado com sucesso." });
});

router.get("/auth/me", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

export default router;
