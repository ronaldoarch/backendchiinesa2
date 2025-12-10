import { Request, Response } from "express";
import { z } from "zod";
import {
  createUser,
  findUserByUsername,
  verifyPassword,
  generateToken,
  findUserById
} from "../services/authService";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  phone: z.string().optional(),
  currency: z.string().default("BRL")
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export async function registerController(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inv?lidos", details: parsed.error.flatten() });
    return;
  }

  const { username, password, phone, currency } = parsed.data;

  // Verificar se usu?rio j? existe
  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    res.status(400).json({ error: "Nome de usu?rio j? est? em uso" });
    return;
  }

  try {
    const user = await createUser(username, password, phone, currency);
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin
      },
      token
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Erro ao criar usu?rio:", error);
    res.status(500).json({ error: "Erro ao criar usu?rio" });
  }
}

export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log("Login attempt:", { username: req.body?.username });
    
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.log("Login: Dados inv?lidos", parsed.error.flatten());
      res.status(400).json({ error: "Dados inv?lidos", details: parsed.error.flatten() });
      return;
    }

    const { username, password } = parsed.data;

    const user = await findUserByUsername(username);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log("Login: Usu?rio n?o encontrado", username);
      res.status(401).json({ error: "Credenciais inv?lidas" });
      return;
    }

    // eslint-disable-next-line no-console
    console.log("Login: Usu?rio encontrado", {
      id: user.id,
      username: user.username,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash?.length,
      password_hash_start: user.password_hash?.substring(0, 10) + "..."
    });

    const isValidPassword = await verifyPassword(password, user.password_hash);
    // eslint-disable-next-line no-console
    console.log("Login: Verifica??o de senha", {
      username,
      password_provided_length: password.length,
      isValidPassword,
      hash_starts_with: user.password_hash?.substring(0, 7)
    });
    
    if (!isValidPassword) {
      // eslint-disable-next-line no-console
      console.log("Login: Senha inv?lida para usu?rio", username, {
        password_length: password.length,
        hash_exists: !!user.password_hash
      });
      res.status(401).json({ error: "Credenciais inv?lidas" });
      return;
    }

    const token = generateToken(user);

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        currency: user.currency,
        is_admin: user.is_admin
      },
      token
    };

    // eslint-disable-next-line no-console
    console.log("Login: Sucesso para usu?rio", username, {
      userId: user.id,
      is_admin_from_db: user.is_admin,
      is_admin_type: typeof user.is_admin,
      token_generated: !!token
    });
    res.json(responseData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login: Erro inesperado", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

export async function meController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ error: "N?o autenticado" });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ error: "Usu?rio n?o encontrado" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    phone: user.phone,
    currency: user.currency,
    is_admin: user.is_admin
  });
}
