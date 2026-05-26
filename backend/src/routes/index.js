import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import patientsRoutes from "./patients.routes.js";

const router = Router();

router.use(authRoutes);
router.use(healthRoutes);
router.use(patientsRoutes);

export default router;
