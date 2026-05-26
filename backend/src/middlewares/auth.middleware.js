import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../services/auth.service.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.jwtCookieName];

    if (!token) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash").lean();

    if (!user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}
