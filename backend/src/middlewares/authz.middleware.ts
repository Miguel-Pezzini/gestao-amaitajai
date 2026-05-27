import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/user.model.js";

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Não autenticado." });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Sem permissão para executar esta ação." });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(["administrador"]);
