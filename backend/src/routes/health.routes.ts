import { Router, type Request, type Response } from "express";
import { prisma } from "../db/prisma.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: "ok", database: "ok" });
    } catch {
      res.status(503).json({ status: "degraded", database: "unavailable" });
    }
  }),
);

export default router;
