import { Router, type Request, type Response } from "express";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/authz.middleware.js";
import { patientFundingSourceService } from "../services/patient-funding-source.service.js";
import { validateIsActive } from "../validators/patient/patient-funding-source.validator.js";

const router = Router();

function getRouteId(param: string | string[]): string {
  return Array.isArray(param) ? (param[0] ?? "") : param;
}

function handleServiceError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message, code: error.name });
    return;
  }

  console.error("Falha inesperada na API de fontes de custeio:", error);
  res.status(500).json({
    message: "Não foi possível completar a solicitação. Tente novamente em instantes.",
  });
}

router.use(requireAuth);

router.get("/funding-sources", async (_req: Request, res: Response) => {
  try {
    const result = await patientFundingSourceService.listFundingSources();
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.post("/funding-sources", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await patientFundingSourceService.createFundingSource(req.body ?? {});
    res.status(201).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/funding-sources/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await patientFundingSourceService.updateFundingSource(
      getRouteId(req.params.id),
      req.body ?? {},
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

router.patch("/funding-sources/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const isActive = validateIsActive((req.body as { isActive?: unknown })?.isActive);
    const result = await patientFundingSourceService.updateFundingSourceStatus(
      getRouteId(req.params.id),
      isActive,
    );
    res.status(200).json(result);
  } catch (error) {
    handleServiceError(res, error);
  }
});

export default router;
