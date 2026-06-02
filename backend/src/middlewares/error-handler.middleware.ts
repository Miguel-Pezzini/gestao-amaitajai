import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "Rota não encontrada." });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, code: error.name });
    return;
  }

  console.error("Erro não tratado na API:", error);

  res.status(500).json({
    message: "Não foi possível completar a solicitação. Tente novamente em instantes.",
    ...(env.isProduction
      ? {}
      : {
          detail: error instanceof Error ? error.message : String(error),
        }),
  });
}
