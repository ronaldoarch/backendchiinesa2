import { Request, Response } from "express";
import { getDashboardStats } from "../services/statsService";
import { asyncHandler } from "../middleware/asyncHandler";

export async function getDashboardStatsController(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
}

export const statsController = {
  getDashboardStats: asyncHandler(getDashboardStatsController)
};

