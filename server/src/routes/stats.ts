import { Router } from "express";
import { getDashboardStatsController } from "../controllers/statsController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const statsRouter = Router();

statsRouter.get("/dashboard", authenticate, requireAdmin, asyncHandler(getDashboardStatsController));

