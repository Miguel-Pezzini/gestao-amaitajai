import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin, requireClinicalOperator } from "../middlewares/authz.middleware.js";
import { agendaService } from "../services/agenda.service.js";
import { validateIsActive } from "../validators/agenda/room.validator.js";

const router = Router();

router.use("/agenda", requireAuth);

router.get(
  "/agenda/lookups/patients",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.searchPatients(req.query as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/lookups/professionals",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.searchProfessionals(req.query as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/rooms",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await agendaService.listRooms();
    res.status(200).json(result);
  }),
);

router.post(
  "/agenda/rooms",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.createRoom((req.body ?? {}) as { name?: unknown });
    res.status(201).json(result);
  }),
);

router.patch(
  "/agenda/rooms/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.updateRoom(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/rooms/:id/status",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await agendaService.updateRoomStatus(getRouteId(req.params.id), isActive);
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/session-types",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await agendaService.listSessionTypes();
    res.status(200).json(result);
  }),
);

router.post(
  "/agenda/session-types",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
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
  }),
);

router.patch(
  "/agenda/session-types/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.updateSessionType(getRouteId(req.params.id), req.body ?? {});
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/session-types/:id/status",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await agendaService.updateSessionTypeStatus(
      getRouteId(req.params.id),
      isActive,
    );
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/session-modalities",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await agendaService.listSessionModalitySettings();
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/session-modalities/:modality",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.updateSessionModalitySetting(
      getRouteId(req.params.modality),
      (req.body ?? {}) as Record<string, unknown>,
    );
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/sessions",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.listSessions(
      req.query as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.post(
  "/agenda/sessions",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.createSession(
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(201).json(result);
  }),
);

router.patch(
  "/agenda/sessions/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.updateSession(
      getRouteId(req.params.id),
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/sessions/:id/cancel",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.cancelSession(
      getRouteId(req.params.id),
      (req.body ?? {}) as { cancelReason?: unknown; scope?: unknown },
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/sessions/:id/complete",
  requireClinicalOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.completeSession(getRouteId(req.params.id), req.user!);
    res.status(200).json(result);
  }),
);

router.get(
  "/agenda/session-change-requests",
  requireClinicalOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.listSessionChangeRequests(
      req.query as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.post(
  "/agenda/sessions/:id/change-requests/edit",
  requireClinicalOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.createSessionEditRequest(
      getRouteId(req.params.id),
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(201).json(result);
  }),
);

router.post(
  "/agenda/sessions/:id/change-requests/cancel",
  requireClinicalOperator,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.createSessionCancelRequest(
      getRouteId(req.params.id),
      (req.body ?? {}) as { cancelReason?: unknown; scope?: unknown },
      req.user!,
    );
    res.status(201).json(result);
  }),
);

router.patch(
  "/agenda/session-change-requests/:id/approve",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.approveSessionChangeRequest(
      getRouteId(req.params.id),
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.patch(
  "/agenda/session-change-requests/:id/reject",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await agendaService.rejectSessionChangeRequest(
      getRouteId(req.params.id),
      (req.body ?? {}) as { rejectionReason?: unknown },
      req.user!,
    );
    res.status(200).json(result);
  }),
);

export default router;
