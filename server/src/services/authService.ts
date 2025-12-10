import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { env } from "../config/env";

export type User = {
  id: number;
  username: string;
  phone?: string;
  currency: string;
  is_admin: boolean;
  created_at: Date;
};

export type UserWithPassword = User & {
  password_hash: string;
};

export async function createUser(
  username: string,
  password: string,
  phone?: string,
  currency: string = "BRL"
): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10);
  
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, phone, currency) 
     VALUES (?, ?, ?, ?)`,
    [username, passwordHash, phone || null, currency]
  );

  const insertResult = result as { insertId: number };
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, username, phone, currency, is_admin, created_at FROM users WHERE id = ?",
    [insertResult.insertId]
  );

  return rows[0] as User;
}

export async function findUserByUsername(username: string): Promise<UserWithPassword | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, username, password_hash, phone, currency, is_admin, created_at FROM users WHERE username = ?",
    [username]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as UserWithPassword;
}

export async function findUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, username, phone, currency, is_admin, created_at FROM users WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as User;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: number; username: string; is_admin: boolean } | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: number; username: string; is_admin: boolean };
    return decoded;
  } catch {
    return null;
  }
}
