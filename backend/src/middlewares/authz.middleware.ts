import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../domain/agenda.js";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Acesso negado." });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole("administrador");
