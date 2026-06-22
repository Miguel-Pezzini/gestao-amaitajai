import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireClinicalOperator } from "../middlewares/authz.middleware.js";
import { patientEvolutionService } from "../services/patient-evolution.service.js";

const router = Router();

router.use("/agenda/sessions", requireAuth, requireClinicalOperator);
router.use("/patients", requireAuth, requireClinicalOperator);

router.get(
  "/agenda/sessions/:sessionId/evolutions",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientEvolutionService.listSessionEvolutions(
      getRouteId(req.params.sessionId),
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.put(
  "/agenda/sessions/:sessionId/evolutions/:patientId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientEvolutionService.upsertSessionEvolution(
      getRouteId(req.params.sessionId),
      getRouteId(req.params.patientId),
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.get(
  "/patients/:patientId/evolutions",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientEvolutionService.listPatientEvolutions(
      getRouteId(req.params.patientId),
      req.query as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

export default router;
