import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

export type Bonus = {
  id: number;
  name: string;
  type: "first_deposit" | "deposit" | "vip_level" | "custom";
  bonusPercentage: number;
  bonusFixed: number;
  minDeposit: number;
  maxBonus: number | null;
  rolloverMultiplier: number;
  rtpPercentage: number;
  active: boolean;
  vipLevelRequired: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserBonus = {
  id: number;
  userId: number;
  bonusId: number;
  transactionId: number | null;
  bonusAmount: number;
  depositAmount: number;
  rolloverRequired: number;
  rolloverCompleted: number;
  status: "pending" | "active" | "completed" | "cancelled";
  rtpPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listBonuses(): Promise<Bonus[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      id, name, type, bonus_percentage as bonusPercentage, 
      bonus_fixed as bonusFixed, min_deposit as minDeposit,
      max_bonus as maxBonus, rollover_multiplier as rolloverMultiplier,
      rtp_percentage as rtpPercentage, active,
      vip_level_required as vipLevelRequired,
      created_at as createdAt, updated_at as updatedAt
     FROM bonuses
     ORDER BY created_at DESC`
  );
  return rows as Bonus[];
}

export async function getBonus(id: number): Promise<Bonus | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      id, name, type, bonus_percentage as bonusPercentage, 
      bonus_fixed as bonusFixed, min_deposit as minDeposit,
      max_bonus as maxBonus, rollover_multiplier as rolloverMultiplier,
      rtp_percentage as rtpPercentage, active,
      vip_level_required as vipLevelRequired,
      created_at as createdAt, updated_at as updatedAt
     FROM bonuses WHERE id = ?`,
    [id]
  );
  return rows.length > 0 ? (rows[0] as Bonus) : null;
}

export async function createBonus(data: {
  name: string;
  type: "first_deposit" | "deposit" | "vip_level" | "custom";
  bonusPercentage?: number;
  bonusFixed?: number;
  minDeposit?: number;
  maxBonus?: number | null;
  rolloverMultiplier?: number;
  rtpPercentage?: number;
  active?: boolean;
  vipLevelRequired?: number | null;
}): Promise<Bonus> {
  const [result] = await pool.query(
    `INSERT INTO bonuses (
      name, type, bonus_percentage, bonus_fixed, min_deposit,
      max_bonus, rollover_multiplier, rtp_percentage, active, vip_level_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.type,
      data.bonusPercentage || 0,
      data.bonusFixed || 0,
      data.minDeposit || 0,
      data.maxBonus || null,
      data.rolloverMultiplier || 1.0,
      data.rtpPercentage || 96.0,
      data.active !== false,
      data.vipLevelRequired || null
    ]
  );

  const bonus = await getBonus((result as any).insertId);
  if (!bonus) {
    throw new Error("Erro ao criar bônus");
  }
  return bonus;
}

export async function updateBonus(
  id: number,
  data: Partial<{
    name: string;
    type: "first_deposit" | "deposit" | "vip_level" | "custom";
    bonusPercentage: number;
    bonusFixed: number;
    minDeposit: number;
    maxBonus: number | null;
    rolloverMultiplier: number;
    rtpPercentage: number;
    active: boolean;
    vipLevelRequired: number | null;
  }>
): Promise<Bonus | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.type !== undefined) {
    fields.push("type = ?");
    values.push(data.type);
  }
  if (data.bonusPercentage !== undefined) {
    fields.push("bonus_percentage = ?");
    values.push(data.bonusPercentage);
  }
  if (data.bonusFixed !== undefined) {
    fields.push("bonus_fixed = ?");
    values.push(data.bonusFixed);
  }
  if (data.minDeposit !== undefined) {
    fields.push("min_deposit = ?");
    values.push(data.minDeposit);
  }
  if (data.maxBonus !== undefined) {
    fields.push("max_bonus = ?");
    values.push(data.maxBonus);
  }
  if (data.rolloverMultiplier !== undefined) {
    fields.push("rollover_multiplier = ?");
    values.push(data.rolloverMultiplier);
  }
  if (data.rtpPercentage !== undefined) {
    fields.push("rtp_percentage = ?");
    values.push(data.rtpPercentage);
  }
  if (data.active !== undefined) {
    fields.push("active = ?");
    values.push(data.active);
  }
  if (data.vipLevelRequired !== undefined) {
    fields.push("vip_level_required = ?");
    values.push(data.vipLevelRequired);
  }

  if (fields.length === 0) {
    return await getBonus(id);
  }

  values.push(id);
  await pool.query(
    `UPDATE bonuses SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  return await getBonus(id);
}

export async function deleteBonus(id: number): Promise<void> {
  await pool.query("DELETE FROM bonuses WHERE id = ?", [id]);
}

/**
 * Aplicar bônus a um depósito
 */
export async function applyBonusToDeposit(
  userId: number,
  transactionId: number,
  depositAmount: number
): Promise<UserBonus | null> {
  // Verificar se é primeiro depósito
  const [existingDeposits] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM transactions 
     WHERE user_id = ? AND status = 'PAID_OUT' AND payment_method = 'PIX'`,
    [userId]
  );
  const isFirstDeposit = (existingDeposits[0] as any).count === 0;

  // Buscar bônus aplicável
  let bonus: Bonus | null = null;
  
  if (isFirstDeposit) {
    // Buscar bônus de primeiro depósito
    const [firstDepositBonuses] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM bonuses 
       WHERE type = 'first_deposit' AND active = true 
       AND min_deposit <= ?
       ORDER BY min_deposit DESC LIMIT 1`,
      [depositAmount]
    );
    
    if (firstDepositBonuses.length > 0) {
      bonus = {
        id: firstDepositBonuses[0].id,
        name: firstDepositBonuses[0].name,
        type: firstDepositBonuses[0].type,
        bonusPercentage: Number(firstDepositBonuses[0].bonus_percentage),
        bonusFixed: Number(firstDepositBonuses[0].bonus_fixed),
        minDeposit: Number(firstDepositBonuses[0].min_deposit),
        maxBonus: firstDepositBonuses[0].max_bonus ? Number(firstDepositBonuses[0].max_bonus) : null,
        rolloverMultiplier: Number(firstDepositBonuses[0].rollover_multiplier),
        rtpPercentage: Number(firstDepositBonuses[0].rtp_percentage),
        active: Boolean(firstDepositBonuses[0].active),
        vipLevelRequired: firstDepositBonuses[0].vip_level_required ? Number(firstDepositBonuses[0].vip_level_required) : null,
        createdAt: firstDepositBonuses[0].created_at,
        updatedAt: firstDepositBonuses[0].updated_at
      };
    }
  } else {
    // Buscar bônus de depósito geral
    const [depositBonuses] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM bonuses 
       WHERE type = 'deposit' AND active = true 
       AND min_deposit <= ?
       ORDER BY min_deposit DESC LIMIT 1`,
      [depositAmount]
    );
    
    if (depositBonuses.length > 0) {
      bonus = {
        id: depositBonuses[0].id,
        name: depositBonuses[0].name,
        type: depositBonuses[0].type,
        bonusPercentage: Number(depositBonuses[0].bonus_percentage),
        bonusFixed: Number(depositBonuses[0].bonus_fixed),
        minDeposit: Number(depositBonuses[0].min_deposit),
        maxBonus: depositBonuses[0].max_bonus ? Number(depositBonuses[0].max_bonus) : null,
        rolloverMultiplier: Number(depositBonuses[0].rollover_multiplier),
        rtpPercentage: Number(depositBonuses[0].rtp_percentage),
        active: Boolean(depositBonuses[0].active),
        vipLevelRequired: depositBonuses[0].vip_level_required ? Number(depositBonuses[0].vip_level_required) : null,
        createdAt: depositBonuses[0].created_at,
        updatedAt: depositBonuses[0].updated_at
      };
    }
  }

  if (!bonus) {
    return null;
  }

  // Calcular valor do bônus
  let bonusAmount = 0;
  if (bonus.bonusPercentage > 0) {
    bonusAmount = depositAmount * (bonus.bonusPercentage / 100);
  }
  if (bonus.bonusFixed > 0) {
    bonusAmount += bonus.bonusFixed;
  }
  
  // Aplicar limite máximo
  if (bonus.maxBonus && bonusAmount > bonus.maxBonus) {
    bonusAmount = bonus.maxBonus;
  }

  // Calcular rollover necessário
  const rolloverRequired = (depositAmount + bonusAmount) * bonus.rolloverMultiplier;

  // Buscar ID da transação pelo request_number se necessário
  let finalTransactionId = transactionId;
  if (!finalTransactionId) {
    const [transRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM transactions WHERE user_id = ? AND amount = ? ORDER BY created_at DESC LIMIT 1`,
      [userId, depositAmount]
    );
    if (transRows.length > 0) {
      finalTransactionId = transRows[0].id;
    }
  }

  // Criar registro de bônus do usuário
  const [result] = await pool.query(
    `INSERT INTO user_bonuses (
      user_id, bonus_id, transaction_id, bonus_amount, deposit_amount,
      rollover_required, rollover_completed, status, rtp_percentage
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 'active', ?)`,
    [
      userId,
      bonus.id,
      finalTransactionId,
      bonusAmount,
      depositAmount,
      rolloverRequired,
      bonus.rtpPercentage
    ]
  );

  // Adicionar bônus ao saldo do usuário
  await pool.query(
    `UPDATE users SET balance = balance + ? WHERE id = ?`,
    [bonusAmount, userId]
  );

  const userBonusId = (result as any).insertId;
  const [userBonusRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM user_bonuses WHERE id = ?`,
    [userBonusId]
  );

  return {
    id: userBonusRows[0].id,
    userId: userBonusRows[0].user_id,
    bonusId: userBonusRows[0].bonus_id,
    transactionId: userBonusRows[0].transaction_id,
    bonusAmount: Number(userBonusRows[0].bonus_amount),
    depositAmount: Number(userBonusRows[0].deposit_amount),
    rolloverRequired: Number(userBonusRows[0].rollover_required),
    rolloverCompleted: Number(userBonusRows[0].rollover_completed),
    status: userBonusRows[0].status,
    rtpPercentage: Number(userBonusRows[0].rtp_percentage),
    createdAt: userBonusRows[0].created_at,
    updatedAt: userBonusRows[0].updated_at
  };
}

/**
 * Registrar aposta para calcular rollover
 */
export async function recordBet(
  userId: number,
  betAmount: number,
  winAmount: number,
  gameId?: number
): Promise<void> {
  const netAmount = betAmount - winAmount; // Valor apostado menos ganhos

  // Buscar bônus ativos do usuário
  const [activeBonuses] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM user_bonuses 
     WHERE user_id = ? AND status = 'active' 
     ORDER BY created_at ASC`,
    [userId]
  );

  if (activeBonuses.length === 0) {
    return; // Sem bônus ativos, não precisa registrar
  }

  // Registrar aposta
  const [betResult] = await pool.query(
    `INSERT INTO user_bets (user_id, user_bonus_id, game_id, bet_amount, win_amount, net_amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      activeBonuses[0].id, // Aplicar ao primeiro bônus ativo (FIFO)
      gameId || null,
      betAmount,
      winAmount,
      netAmount
    ]
  );

  // Atualizar rollover completado para cada bônus ativo
  for (const bonus of activeBonuses) {
    const [betRows] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(net_amount), 0) as total_bet 
       FROM user_bets 
       WHERE user_bonus_id = ?`,
      [bonus.id]
    );

    const totalBet = Number((betRows[0] as any).total_bet);
    
    await pool.query(
      `UPDATE user_bonuses 
       SET rollover_completed = ?, 
           status = CASE 
             WHEN ? >= rollover_required THEN 'completed' 
             ELSE 'active' 
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [totalBet, totalBet, bonus.id]
    );
  }

  // Atualizar total apostado do usuário
  await pool.query(
    `UPDATE users SET total_bet_amount = total_bet_amount + ? WHERE id = ?`,
    [netAmount, userId]
  );
}

/**
 * Verificar se usuário pode sacar (rollover completo)
 */
export async function canUserWithdraw(userId: number): Promise<{ can: boolean; reason?: string }> {
  const [activeBonuses] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM user_bonuses 
     WHERE user_id = ? AND status = 'active'`,
    [userId]
  );

  if (activeBonuses.length === 0) {
    return { can: true };
  }

  const incompleteBonuses = activeBonuses.filter(
    (b: any) => Number(b.rollover_completed) < Number(b.rollover_required)
  );

  if (incompleteBonuses.length > 0) {
    const totalRemaining = incompleteBonuses.reduce(
      (sum: number, b: any) => sum + (Number(b.rollover_required) - Number(b.rollover_completed)),
      0
    );
    return {
      can: false,
      reason: `Você precisa completar R$ ${totalRemaining.toFixed(2)} em apostas antes de poder sacar.`
    };
  }

  return { can: true };
}

/**
 * Buscar bônus ativos do usuário
 */
export async function getUserActiveBonuses(userId: number): Promise<UserBonus[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM user_bonuses 
     WHERE user_id = ? AND status = 'active' 
     ORDER BY created_at ASC`,
    [userId]
  );

  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    bonusId: row.bonus_id,
    transactionId: row.transaction_id,
    bonusAmount: Number(row.bonus_amount),
    depositAmount: Number(row.deposit_amount),
    rolloverRequired: Number(row.rollover_required),
    rolloverCompleted: Number(row.rollover_completed),
    status: row.status,
    rtpPercentage: Number(row.rtp_percentage),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

