import { Router } from "express";
import {
  createGameController,
  listGamesController,
  syncGamePlayfiversController
} from "../controllers/gamesController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const gamesRouter = Router();

// GET público (qualquer um pode ver)
gamesRouter.get("/", asyncHandler(listGamesController));

// POST requer autenticação e admin
gamesRouter.post("/", authenticate, requireAdmin, asyncHandler(createGameController));
gamesRouter.post("/:id/sync-playfivers", authenticate, requireAdmin, asyncHandler(syncGamePlayfiversController));

