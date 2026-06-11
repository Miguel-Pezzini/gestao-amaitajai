import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { patientFundingSourceService } from "../services/patient-funding-source.service.js";
import { validateIsActive } from "../validators/patient/patient-funding-source.validator.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/funding-sources",
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await patientFundingSourceService.listFundingSources();
    res.status(200).json(result);
  }),
);

router.post(
  "/funding-sources",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientFundingSourceService.createFundingSource(req.body ?? {});
    res.status(201).json(result);
  }),
);

router.patch(
  "/funding-sources/:id",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientFundingSourceService.updateFundingSource(
      getRouteId(req.params.id),
      req.body ?? {},
    );
    res.status(200).json(result);
  }),
);

router.patch(
  "/funding-sources/:id/status",
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await patientFundingSourceService.updateFundingSourceStatus(
      getRouteId(req.params.id),
      isActive,
    );
    res.status(200).json(result);
  }),
);

export default router;
