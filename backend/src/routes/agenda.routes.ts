import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import { validateIsActive } from "../validators/agenda/room.validator.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { agendaService } from "../services/agenda.service.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

function handleServiceError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, code: error.name });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const firstMessage = Object.values(error.errors)[0]?.message;
    res.status(400).json({
      message: firstMessage ?? "Revise os dados informados para a sessão.",
    });
    return;
  }

  console.error("Falha inesperada na API de sessões:", error);
  res.status(500).json({
    message: "Não foi possível completar a solicitação. Tente novamente em instantes.",
  });
}

router.use("/agenda", requireAuth);

router.get("/agenda/lookups/patients", async (req: Request, res: Response) => {
  try {
    const result = await agendaService.searchPatients(req.query as { q?: unknown; limit?: unknown });
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/agenda/lookups/professionals", async (req: Request, res: Response) => {
  try {
    const result = await agendaService.searchProfessionals(req.query as { q?: unknown; limit?: unknown });
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

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
    const result = await agendaService.createRoom((req.body ?? {}) as { name?: unknown });
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/rooms/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.updateRoom(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/rooms/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await agendaService.updateRoomStatus(getRouteId(req.params.id), isActive);
    res.status(200).json(result);
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

router.patch("/agenda/session-types/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.updateSessionType(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/session-types/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await agendaService.updateSessionTypeStatus(
      getRouteId(req.params.id),
      isActive,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.get("/agenda/session-modalities", async (_req: Request, res: Response) => {
  try {
    const result = await agendaService.listSessionModalitySettings();
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/agenda/session-modalities/:modality", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await agendaService.updateSessionModalitySetting(
      getRouteId(req.params.modality),
      (req.body ?? {}) as Record<string, unknown>,
    );
    res.status(200).json(result);
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
