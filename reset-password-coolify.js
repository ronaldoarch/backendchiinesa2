// Script para resetar senha via Coolify
// Execute no terminal do Coolify: node reset-password-coolify.js teste teste123

const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

// Usar variáveis de ambiente do Coolify
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function resetPassword() {
  const username = process.argv[2] || "teste";
  const newPassword = process.argv[3] || "teste123";
  
  console.log(`🔄 Resetando senha para: ${username}`);
  console.log(`   Nova senha: ${newPassword}`);
  console.log(`   DB Host: ${dbConfig.host}`);
  console.log(`   DB Name: ${dbConfig.database}`);
  
  if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error("❌ Erro: Variáveis de ambiente do banco não configuradas!");
    console.error("   Verifique: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME");
    process.exit(1);
  }
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Verificar se usuário existe
    const [users] = await connection.query(
      "SELECT id, username, is_admin FROM users WHERE username = ?",
      [username]
    );
    
    // Gerar hash da nova senha
    console.log("   Gerando hash da senha...");
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    if (users.length === 0) {
      console.log(`   Usuário "${username}" não encontrado. Criando...`);
      
      // Criar usuário se não existir
      await connection.query(
        "INSERT INTO users (username, password_hash, currency, is_admin) VALUES (?, ?, 'BRL', false)",
        [username, passwordHash]
      );
      console.log(`✅ Usuário "${username}" criado com sucesso!`);
    } else {
      // Atualizar senha no banco
      const [result] = await connection.query(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        [passwordHash, username]
      );
      
      console.log(`✅ Senha resetada com sucesso!`);
      console.log(`   Usuário ID: ${users[0].id}`);
      console.log(`   É admin: ${users[0].is_admin ? 'Sim' : 'Não'}`);
    }
    
    console.log(`\n📝 Agora você pode fazer login com:`);
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${newPassword}\n`);
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetPassword();
