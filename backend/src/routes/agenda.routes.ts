import { Router, type Request, type Response } from "express";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { agendaService } from "../services/agenda.service.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

function handleServiceError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  console.error("Erro inesperado em agenda:", error);
  res.status(500).json({ message: "Erro interno ao processar agenda." });
}

router.use("/agenda", requireAuth);

router.get("/agenda/rooms", async (_req: Request, res: Response) => {
  try {
    const result = await agendaService.listRooms();
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post("/agenda/rooms", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.createRoom((req.body ?? {}) as { name?: unknown; code?: unknown });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/agenda/session-types", async (_req: Request, res: Response) => {
  try {
    const result = await agendaService.listSessionTypes();
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post("/agenda/session-types", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.createSessionType(
      (req.body ?? {}) as {
        name?: unknown;
        slug?: unknown;
        defaultDurationMinutes?: unknown;
        isDurationFlexible?: unknown;
        allowedModalities?: unknown;
      },
    );
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/agenda/sessions", async (req: Request, res: Response) => {
  try {
    const result = await agendaService.listSessions(
      req.query as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post("/agenda/sessions", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.createSession(
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/sessions/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.updateSession(
      getRouteId(req.params.id),
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/sessions/:id/cancel", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.cancelSession(
      getRouteId(req.params.id),
      (req.body ?? {}) as { cancelReason?: unknown },
      req.user!,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/sessions/:id/complete", async (req: Request, res: Response) => {
  try {
    const result = await agendaService.completeSession(getRouteId(req.params.id), req.user!);
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

export default router;
