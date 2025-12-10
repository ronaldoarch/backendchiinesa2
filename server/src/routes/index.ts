import { Router } from "express";
import { providersRouter } from "./providers";
import { gamesRouter } from "./games";
import { bannersRouter } from "./banners";
import { settingsRouter } from "./settings";
import { uploadsRouter } from "./uploads";
import { playfiversRouter } from "./playfivers";
import { authRouter } from "./auth";
import { authenticate, requireAdmin } from "../middleware/auth";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.post("/playfivers/callback", (req, res) => {
  // eslint-disable-next-line no-console
  console.log("Callback PlayFivers recebido:", req.body);
  res.status(200).json({ ok: true });
});

// Rotas públicas
apiRouter.use("/auth", authRouter);

// Rotas de leitura públicas, escrita protegida
apiRouter.use("/providers", providersRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/banners", bannersRouter);

// Rotas protegidas (requerem autenticação e admin)
apiRouter.use("/settings", authenticate, requireAdmin, settingsRouter);
apiRouter.use("/uploads", authenticate, requireAdmin, uploadsRouter);
apiRouter.use("/playfivers", authenticate, requireAdmin, playfiversRouter);



