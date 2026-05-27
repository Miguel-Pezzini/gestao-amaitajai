import type { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../services/auth.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[env.jwtCookieName] as string | undefined;

    if (!token) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash").lean();

    if (!user) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    if (user.isActive === false) {
      res.status(403).json({ message: "Usuário inativo." });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado." });
  }
}
