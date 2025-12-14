import { Router } from "express";
import {
  listBonusesController,
  getBonusController,
  createBonusController,
  updateBonusController,
  deleteBonusController,
  getUserBonusesController
} from "../controllers/bonusController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const bonusesRouter = Router();

// Rotas públicas (usuário autenticado)
bonusesRouter.get("/user", authenticate, asyncHandler(getUserBonusesController));

// Rotas protegidas (admin)
bonusesRouter.get("/", authenticate, requireAdmin, asyncHandler(listBonusesController));
bonusesRouter.get("/:id", authenticate, requireAdmin, asyncHandler(getBonusController));
bonusesRouter.post("/", authenticate, requireAdmin, asyncHandler(createBonusController));
bonusesRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updateBonusController));
bonusesRouter.delete("/:id", authenticate, requireAdmin, asyncHandler(deleteBonusController));

