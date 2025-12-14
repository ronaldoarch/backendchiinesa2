# 🔍 Diagnóstico: Erro 502 Bad Gateway

## ❌ Problema
O frontend está recebendo erro **502 Bad Gateway** ao tentar acessar o backend no Coolify.

## 🔍 Possíveis Causas

### 1. Backend não está rodando no Coolify
- O serviço pode ter parado
- Pode ter crashado após as últimas mudanças

### 2. Erro de compilação/execução
- Erro de sintaxe TypeScript
- Dependências faltando
- Erro ao inicializar banco de dados

### 3. Porta incorreta
- Coolify pode estar esperando outra porta
- Variável de ambiente `PORT` não configurada

## ✅ Soluções

### Passo 1: Verificar Logs no Coolify

1. Acesse o **Coolify**
2. Vá no serviço do backend
3. Clique em **"Logs"**
4. Procure por erros recentes

**Erros comuns:**
- `Error: connect ETIMEDOUT` → Problema de conexão MySQL
- `Cannot find module` → Dependências faltando
- `SyntaxError` → Erro de sintaxe
- `Port already in use` → Porta ocupada

### Passo 2: Reiniciar o Serviço

No Coolify:
1. Vá no serviço do backend
2. Clique em **"Restart"** ou **"Redeploy"**
3. Aguarde alguns minutos
4. Verifique os logs novamente

### Passo 3: Verificar Variáveis de Ambiente

No Coolify, verifique se estas variáveis estão configuradas:

```env
DB_HOST=shortline.proxy.rlwy.net
DB_PORT=23856
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=railway
PORT=4000
NODE_ENV=production
```

### Passo 4: Verificar Build

Se o problema persistir, pode ser necessário fazer rebuild:

1. No Coolify, vá em **"Settings"** do serviço
2. Clique em **"Redeploy"** ou **"Force Rebuild"**
3. Aguarde o build completar
4. Verifique os logs

### Passo 5: Testar Health Check

Após reiniciar, teste se o backend está respondendo:

```bash
curl https://r404c0kskws08wccgw08kk4k.agenciamidas.com/health
```

**Resposta esperada:**
```json
{"ok":true,"status":"healthy"}
```

Se não responder, o servidor não está rodando.

### Passo 6: Verificar CORS (se health check funcionar)

Se o health check funcionar mas o frontend ainda der erro:

1. O CORS já está configurado para aceitar todas as origens (`origin: "*"`)
2. Verifique se não há firewall bloqueando

## 🚨 Erro Específico: Banco de Dados

Se os logs mostrarem erro de conexão MySQL:

1. Verifique se as credenciais do Railway estão corretas
2. Teste a conexão MySQL diretamente:
   ```bash
   mysql -h shortline.proxy.rlwy.net -P 23856 -u root -p
   ```
3. Verifique se o IP do Coolify está na whitelist do Railway (se aplicável)

## 📝 Checklist Rápido

- [ ] Backend está rodando no Coolify?
- [ ] Logs mostram algum erro?
- [ ] Variáveis de ambiente estão corretas?
- [ ] Health check (`/health`) responde?
- [ ] MySQL está acessível?
- [ ] Porta está correta (4000)?

## 🔧 Comando para Testar Localmente

Se quiser testar localmente antes de fazer deploy:

```bash
# Instalar dependências
npm install

# Configurar .env
cp env.example .env
# Editar .env com suas credenciais

# Rodar servidor
npm run dev:server
```

Se funcionar localmente, o problema é no Coolify/deploy.

## 💡 Próximos Passos

1. **Verifique os logs no Coolify primeiro**
2. **Reinicie o serviço**
3. **Teste o health check**
4. **Se ainda não funcionar, compartilhe os logs de erro**

