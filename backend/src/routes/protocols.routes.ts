import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { protocolService } from "../services/protocol.service.js";
import { validateIsActive } from "../validators/protocol/protocol-type.validator.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get(
  "/protocol-types",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await protocolService.listProtocolTypes();
    res.status(200).json(result);
  }),
);

router.post(
  "/protocol-types",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.createProtocolType(req.body ?? {});
    res.status(201).json(result);
  }),
);

router.patch(
  "/protocol-types/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.updateProtocolType(
      getRouteId(req.params.id),
      req.body ?? {},
    );
    res.status(200).json(result);
  }),
);

router.patch(
  "/protocol-types/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await protocolService.updateProtocolTypeStatus(
      getRouteId(req.params.id),
      isActive,
    );
    res.status(200).json(result);
  }),
);

router.get(
  "/protocols",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.listProtocols(req.query as Record<string, unknown>);
    res.status(200).json(result);
  }),
);

router.get(
  "/protocols/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.getProtocol(getRouteId(req.params.id));
    res.status(200).json(result);
  }),
);

router.get(
  "/patients/:patientId/protocols",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.listProtocolsByPatient(getRouteId(req.params.patientId));
    res.status(200).json(result);
  }),
);

router.post(
  "/protocols",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.createProtocol(req.body ?? {}, req.user!);
    res.status(201).json(result);
  }),
);

router.patch(
  "/protocols/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await protocolService.updateProtocolStatus(
      getRouteId(req.params.id),
      req.body ?? {},
      req.user!,
    );
    res.status(200).json(result);
  }),
);

export default router;
