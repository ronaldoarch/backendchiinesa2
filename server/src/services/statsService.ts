import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

export type DashboardStats = {
  totalDeposits: number;
  totalDepositsToday: number;
  totalUsers: number;
  newUsersToday: number;
  conversionRate: number; // Taxa de conversão (usuários que depositaram / total de usuários)
  ftdToday: number; // First Time Deposits hoje
  totalWithdrawals: number;
  totalWithdrawalsToday: number;
  activeUsers: number; // Usuários que fizeram transação nos últimos 30 dias
  averageDeposit: number;
  depositsByStatus: {
    pending: number;
    paid: number;
    failed: number;
    canceled: number;
  };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString().slice(0, 19).replace("T", " ");

  // Total de depósitos (apenas PIX-IN pagos)
  const [depositsResult] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE payment_method = 'PIX' 
      AND status IN ('PAID', 'PAID_OUT')
      AND amount > 0`
  );
  const totalDeposits = Number(depositsResult[0]?.total || 0);

  // Depósitos de hoje
  const [depositsTodayResult] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE payment_method = 'PIX' 
      AND status IN ('PAID', 'PAID_OUT')
      AND amount > 0
      AND DATE(created_at) = CURDATE()`
  );
  const totalDepositsToday = Number(depositsTodayResult[0]?.total || 0);

  // Total de usuários
  const [usersResult] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM users`
  );
  const totalUsers = Number(usersResult[0]?.count || 0);

  // Novos usuários hoje
  const [newUsersTodayResult] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count 
    FROM users 
    WHERE DATE(created_at) = CURDATE()`
  );
  const newUsersToday = Number(newUsersTodayResult[0]?.count || 0);

  // FTD hoje (First Time Deposits - usuários que fizeram primeiro depósito hoje)
  const [ftdResult] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT user_id) as count
    FROM transactions t1
    WHERE payment_method = 'PIX'
      AND status IN ('PAID', 'PAID_OUT')
      AND amount > 0
      AND DATE(t1.created_at) = CURDATE()
      AND NOT EXISTS (
        SELECT 1 FROM transactions t2
        WHERE t2.user_id = t1.user_id
          AND t2.payment_method = 'PIX'
          AND t2.status IN ('PAID', 'PAID_OUT')
          AND t2.amount > 0
          AND DATE(t2.created_at) < CURDATE()
      )`
  );
  const ftdToday = Number(ftdResult[0]?.count || 0);

  // Total de saques
  const [withdrawalsResult] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(ABS(amount)), 0) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE payment_method = 'PIX' 
      AND status IN ('PAID', 'PAID_OUT')
      AND amount < 0`
  );
  const totalWithdrawals = Number(withdrawalsResult[0]?.total || 0);

  // Saques de hoje
  const [withdrawalsTodayResult] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(ABS(amount)), 0) as total,
      COUNT(*) as count
    FROM transactions 
    WHERE payment_method = 'PIX' 
      AND status IN ('PAID', 'PAID_OUT')
      AND amount < 0
      AND DATE(created_at) = CURDATE()`
  );
  const totalWithdrawalsToday = Number(withdrawalsTodayResult[0]?.total || 0);

  // Usuários ativos (fizeram transação nos últimos 30 dias)
  const [activeUsersResult] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT user_id) as count
    FROM transactions
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND status IN ('PAID', 'PAID_OUT')`
  );
  const activeUsers = Number(activeUsersResult[0]?.count || 0);

  // Média de depósito
  const [avgDepositResult] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(AVG(amount), 0) as avg
    FROM transactions
    WHERE payment_method = 'PIX'
      AND status IN ('PAID', 'PAID_OUT')
      AND amount > 0`
  );
  const averageDeposit = Number(avgDepositResult[0]?.avg || 0);

  // Depósitos por status
  const [depositsByStatusResult] = await pool.query<RowDataPacket[]>(
    `SELECT 
      status,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE payment_method = 'PIX' AND amount > 0
    GROUP BY status`
  );

  const depositsByStatus = {
    pending: 0,
    paid: 0,
    failed: 0,
    canceled: 0
  };

  depositsByStatusResult.forEach((row: any) => {
    const status = (row.status || "").toUpperCase();
    if (status === "PENDING") {
      depositsByStatus.pending = Number(row.count || 0);
    } else if (status === "PAID" || status === "PAID_OUT") {
      depositsByStatus.paid = Number(row.count || 0);
    } else if (status === "FAILED") {
      depositsByStatus.failed = Number(row.count || 0);
    } else if (status === "CANCELED") {
      depositsByStatus.canceled = Number(row.count || 0);
    }
  });

  // Taxa de conversão (usuários que depositaram / total de usuários)
  const [usersWithDepositsResult] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT user_id) as count
    FROM transactions
    WHERE payment_method = 'PIX'
      AND status IN ('PAID', 'PAID_OUT')
      AND amount > 0`
  );
  const usersWithDeposits = Number(usersWithDepositsResult[0]?.count || 0);
  const conversionRate = totalUsers > 0 ? (usersWithDeposits / totalUsers) * 100 : 0;

  return {
    totalDeposits,
    totalDepositsToday,
    totalUsers,
    newUsersToday,
    conversionRate: Math.round(conversionRate * 100) / 100,
    ftdToday,
    totalWithdrawals,
    totalWithdrawalsToday,
    activeUsers,
    averageDeposit: Math.round(averageDeposit * 100) / 100,
    depositsByStatus
  };
}

