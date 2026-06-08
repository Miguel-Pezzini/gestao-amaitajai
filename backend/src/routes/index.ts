import { Router } from "express";
import agendaRoutes from "./agenda.routes.js";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import patientsRoutes from "./patients.routes.js";
import protocolsRoutes from "./protocols.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.use(authRoutes);
router.use(agendaRoutes);
router.use(healthRoutes);
router.use(patientsRoutes);
router.use(protocolsRoutes);
router.use(usersRoutes);

export default router;
