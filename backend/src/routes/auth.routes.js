import { Router } from "express";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  buildAuthCookieOptions,
  generateAccessToken,
  validateCredentials,
} from "../services/auth.service.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
  }

  const user = await validateCredentials(email, password);

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const token = generateAccessToken(user._id.toString());
  res.cookie(env.jwtCookieName, token, buildAuthCookieOptions());

  return res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(env.jwtCookieName, buildAuthCookieOptions());
  return res.status(200).json({ message: "Logout realizado com sucesso." });
});

router.get("/auth/me", requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default router;
