import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { withMongoId } from "../db/serialize.js";
import { resolveAccessTokenFromRequest, verifyAccessToken } from "../services/auth.service.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = resolveAccessTokenFromRequest(req);

    if (!token) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    if (user.accountStatus === "INATIVO") {
      res.status(403).json({ message: "Conta inativa." });
      return;
    }

    req.user = withMongoId(user);
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado." });
  }
}
