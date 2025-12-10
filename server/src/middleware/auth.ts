import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

export interface AuthRequest extends Request {
  userId?: number;
  userIsAdmin?: boolean;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }

  (req as AuthRequest).userId = decoded.id;
  (req as AuthRequest).userIsAdmin = decoded.is_admin;

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  
  if (!authReq.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (!authReq.userIsAdmin) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
  }

  next();
}
