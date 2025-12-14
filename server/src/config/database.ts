import mysql, { RowDataPacket } from "mysql2/promise";
import { env } from "./env";

const dbConfig = {
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000 // 30 segundos de timeout
};

// Log da configuração (sem senha)
console.log("🔌 Configurando conexão MySQL:", {
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  database: env.dbName,
  hasPassword: !!env.dbPassword
});

export const pool = mysql.createPool(dbConfig);

// Testar conexão ao inicializar (após criar o pool)
pool.getConnection()
  .then((connection) => {
    console.log("✅ Conexão MySQL estabelecida com sucesso!");
    connection.release();
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar ao MySQL:", error.message);
  });

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        external_id VARCHAR(255),
        active BOOLEAN NOT NULL DEFAULT true
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        external_id VARCHAR(255),
        image_url TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar coluna image_url se não existir (para bancos já existentes)
    try {
      const [columns] = await connection.query<any[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'games' 
         AND COLUMN_NAME = 'image_url'`
      );
      
      if (!columns || columns.length === 0) {
        await connection.query(`
          ALTER TABLE games 
          ADD COLUMN image_url TEXT
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna image_url adicionada à tabela games");
      }
    } catch (error: any) {
      // Ignorar erro se a coluna já existir ou se houver outro problema
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna image_url:", error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        image_url VARCHAR(255),
        active BOOLEAN NOT NULL DEFAULT true
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        currency VARCHAR(10) DEFAULT 'BRL',
        balance DECIMAL(10, 2) DEFAULT 0.00,
        is_admin BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_is_admin (is_admin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar coluna balance se não existir (migração)
    try {
      const [balanceColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'balance'`
      );
      
      if (!balanceColumns || balanceColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna balance adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna balance:", error.message);
    }

    // Adicionar colunas email e document se não existirem (migração)
    try {
      const [emailColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'email'`
      );
      
      if (!emailColumns || emailColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN email VARCHAR(255) NULL
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna email adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna email:", error.message);
    }

    try {
      const [documentColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME = 'document'`
      );
      
      if (!documentColumns || documentColumns.length === 0) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN document VARCHAR(20) NULL
        `);
        // eslint-disable-next-line no-console
        console.log("✅ Coluna document adicionada à tabela users");
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Aviso ao verificar/adicionar coluna document:", error.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        request_number VARCHAR(255) UNIQUE NOT NULL,
        transaction_id VARCHAR(255),
        payment_method ENUM('PIX', 'CARD', 'BOLETO') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        qr_code TEXT,
        qr_code_base64 TEXT,
        barcode VARCHAR(255),
        digitable_line VARCHAR(255),
        due_date DATE,
        callback_url TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_request_number (request_number),
        INDEX idx_status (status),
        INDEX idx_payment_method (payment_method)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        category VARCHAR(50) DEFAULT 'eventos',
        active BOOLEAN NOT NULL DEFAULT true,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (active),
        INDEX idx_position (position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de bônus configurados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('first_deposit', 'deposit', 'vip_level', 'custom') NOT NULL,
        bonus_percentage DECIMAL(5, 2) DEFAULT 0.00,
        bonus_fixed DECIMAL(10, 2) DEFAULT 0.00,
        min_deposit DECIMAL(10, 2) DEFAULT 0.00,
        max_bonus DECIMAL(10, 2) DEFAULT NULL,
        rollover_multiplier DECIMAL(5, 2) DEFAULT 1.00,
        rtp_percentage DECIMAL(5, 2) DEFAULT 96.00,
        active BOOLEAN NOT NULL DEFAULT true,
        vip_level_required INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_active (active),
        INDEX idx_vip_level (vip_level_required)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de bônus recebidos pelos usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bonus_id INT NOT NULL,
        transaction_id INT NULL,
        bonus_amount DECIMAL(10, 2) NOT NULL,
        deposit_amount DECIMAL(10, 2) NOT NULL,
        rollover_required DECIMAL(10, 2) NOT NULL,
        rollover_completed DECIMAL(10, 2) DEFAULT 0.00,
        status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'active',
        rtp_percentage DECIMAL(5, 2) DEFAULT 96.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bonus_id) REFERENCES bonuses(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_bonus_id (bonus_id),
        INDEX idx_status (status),
        INDEX idx_transaction_id (transaction_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Tabela de apostas para calcular rollover
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_bets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_bonus_id INT NULL,
        game_id INT NULL,
        bet_amount DECIMAL(10, 2) NOT NULL,
        win_amount DECIMAL(10, 2) DEFAULT 0.00,
        net_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_bonus_id) REFERENCES user_bonuses(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_user_bonus_id (user_bonus_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Adicionar colunas VIP na tabela users
    try {
      const [vipColumns] = await connection.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME IN ('vip_level', 'total_bet_amount')`
      );
      
      const existingColumns = vipColumns.map((row: any) => row.COLUMN_NAME);
      
      if (!existingColumns.includes('vip_level')) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN vip_level INT DEFAULT 0
        `);
        console.log("✅ Coluna vip_level adicionada à tabela users");
      }
      
      if (!existingColumns.includes('total_bet_amount')) {
        await connection.query(`
          ALTER TABLE users 
          ADD COLUMN total_bet_amount DECIMAL(10, 2) DEFAULT 0.00
        `);
        console.log("✅ Coluna total_bet_amount adicionada à tabela users");
      }
    } catch (error: any) {
      console.warn("⚠️ Aviso ao verificar/adicionar colunas VIP:", error.message);
    }

    // eslint-disable-next-line no-console
    console.log("✅ Banco de dados MySQL conectado e tabelas criadas com sucesso!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao conectar/inicializar banco de dados MySQL:", error);
    throw error;
  } finally {
    connection.release();
  }
}



