import { Router, type Request, type Response } from "express";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { protocolService } from "../services/protocol.service.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

function handleServiceError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, code: error.name });
    return;
  }

  console.error("Falha inesperada na API de protocolos:", error);
  res.status(500).json({
    message: "Não foi possível completar a solicitação. Tente novamente em instantes.",
  });
}

router.use(requireAuth, requireAdmin);

router.get("/protocols", async (req: Request, res: Response) => {
  try {
    const result = await protocolService.listProtocols(req.query as Record<string, unknown>);
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/protocols/:id", async (req: Request, res: Response) => {
  try {
    const result = await protocolService.getProtocol(getRouteId(req.params.id));
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/patients/:patientId/protocols", async (req: Request, res: Response) => {
  try {
    const result = await protocolService.listProtocolsByPatient(getRouteId(req.params.patientId));
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post("/protocols", async (req: Request, res: Response) => {
  try {
    const result = await protocolService.createProtocol(req.body ?? {}, req.user!);
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/protocols/:id/status", async (req: Request, res: Response) => {
  try {
    const result = await protocolService.updateProtocolStatus(
      getRouteId(req.params.id),
      req.body ?? {},
      req.user!,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

export default router;
