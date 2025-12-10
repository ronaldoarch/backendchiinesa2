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
  console.log("📥 Callback PlayFivers recebido:", {
    headers: req.headers,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Segundo a documentação, os webhooks podem ser:
  // - POST /webhook (Webhook - Saldo): type: "BALANCE", user_code, retorna balance
  // - POST /api/webhook (Webhook - Transação): type: "WinBet", agent_code, agent_secret, user_code, user_balance, game_original, game_type, slot, retorna balance

  const eventType = req.body.type;
  const userCode = req.body.user_code;
  const agentCode = req.body.agent_code;
  const userBalance = req.body.user_balance;

  // eslint-disable-next-line no-console
  console.log(`📋 Tipo de evento: ${eventType || "desconhecido"}`, {
    user_code: userCode,
    agent_code: agentCode,
    user_balance: userBalance
  });

  // Processar diferentes tipos de webhooks
  if (eventType === "BALANCE") {
    // Webhook de saldo - retornar saldo atualizado
    // eslint-disable-next-line no-console
    console.log("💰 Webhook de saldo recebido para usuário:", userCode);
    
    // TODO: Buscar saldo atual do usuário no banco
    // Por enquanto, retornar o saldo recebido ou buscar do banco
    res.status(200).json({ 
      msg: "",
      balance: userBalance || 0 // Retornar saldo atualizado
    });
    return;
  }

  if (eventType === "WinBet" || eventType === "LoseBet" || eventType === "Bet") {
    // Webhook de transação - processar aposta
    // eslint-disable-next-line no-console
    console.log("🎰 Webhook de transação recebido:", {
      type: eventType,
      user_code: userCode,
      game_type: req.body.game_type,
      slot: req.body.slot
    });
    
    // TODO: Processar transação, atualizar saldo no banco
    // Por enquanto, retornar saldo atualizado
    res.status(200).json({ 
      msg: "",
      balance: userBalance || 0 // Retornar saldo atualizado após a transação
    });
    return;
  }

  // Webhook desconhecido - apenas logar e responder OK
  res.status(200).json({ 
    ok: true, 
    received: true,
    timestamp: new Date().toISOString()
  });
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



