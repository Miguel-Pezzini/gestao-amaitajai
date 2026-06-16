import { Router, type Request, type Response } from "express";
import { asyncHandler, getRouteId } from "../middlewares/async-handler.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { patientAttendanceService } from "../services/patient-attendance.service.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/agenda/sessions/:sessionId/attendance",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientAttendanceService.listSessionAttendance(
      getRouteId(req.params.sessionId),
      req.user!,
    );
    res.status(200).json(result);
  }),
);

router.put(
  "/agenda/sessions/:sessionId/attendance/:patientId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await patientAttendanceService.upsertSessionAttendance(
      getRouteId(req.params.sessionId),
      getRouteId(req.params.patientId),
      (req.body ?? {}) as Record<string, unknown>,
      req.user!,
    );
    res.status(200).json(result);
  }),
);

export default router;
