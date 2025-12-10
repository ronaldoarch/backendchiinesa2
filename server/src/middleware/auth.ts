import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

export interface AuthRequest extends Request {
  userId?: number;
  userIsAdmin?: boolean;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  (req as AuthRequest).userId = decoded.id;
  // Garantir que is_admin seja boolean (pode vir como 0/1 do JWT)
  (req as AuthRequest).userIsAdmin = Boolean(
    decoded.is_admin === true || 
    decoded.is_admin === 1 || 
    decoded.is_admin === "true" ||
    decoded.is_admin === "1"
  );

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  
  if (!authReq.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  // Verificar novamente se é admin (pode ser boolean, número ou string)
  const isAdmin = Boolean(
    authReq.userIsAdmin === true || 
    authReq.userIsAdmin === 1 || 
    authReq.userIsAdmin === "true" ||
    authReq.userIsAdmin === "1"
  );
  
  if (!isAdmin) {
    res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
    return;
  }

  next();
}
