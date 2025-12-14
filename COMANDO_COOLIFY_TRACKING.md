# Comandos para Configurar Tracking no Coolify/Railway

## Opção 1: Via Terminal do Coolify

1. Acesse o terminal do serviço no Coolify
2. Execute o MySQL client:

```bash
mysql -h shortline.proxy.rlwy.net -P 23856 -u root -p
```

3. Digite a senha do MySQL quando solicitado
4. Selecione o banco de dados:

```sql
USE railway;
```

5. Execute os comandos SQL abaixo

## Opção 2: Via Railway Dashboard

1. Acesse o Railway Dashboard
2. Vá em "Data" → "Connect" → "MySQL"
3. Use o cliente MySQL ou execute os comandos SQL diretamente

## Comandos SQL para Executar

### 1. Configurar Facebook Pixel

```sql
INSERT INTO settings (`key`, `value`) 
VALUES ('tracking.facebookPixelId', 'SEU_PIXEL_ID_AQUI')
ON DUPLICATE KEY UPDATE `value` = 'SEU_PIXEL_ID_AQUI';
```

**Substitua `SEU_PIXEL_ID_AQUI` pelo seu ID do Facebook Pixel (ex: `123456789012345`)**

### 2. Configurar Webhook de Tracking

```sql
-- URL do webhook
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.url', 'https://seu-webhook.com/endpoint')
ON DUPLICATE KEY UPDATE `value` = 'https://seu-webhook.com/endpoint';

-- Habilitar webhook
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.enabled', 'true')
ON DUPLICATE KEY UPDATE `value` = 'true';

-- Eventos a receber (use ["*"] para todos)
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.events', '["*"]')
ON DUPLICATE KEY UPDATE `value` = '["*"]';
```

**Substitua `https://seu-webhook.com/endpoint` pela URL do seu webhook**

### 3. Verificar Configurações

```sql
SELECT `key`, `value` FROM settings 
WHERE `key` LIKE 'tracking.%' OR `key` LIKE 'webhook.%'
ORDER BY `key`;
```

## Eventos Disponíveis para Webhooks

- `user_registered` - Usuário registrado
- `user_login` - Usuário fez login
- `deposit_created` - Depósito criado
- `deposit_paid` - Depósito pago
- `deposit_failed` - Depósito falhou
- `withdrawal_paid` - Saque processado
- `*` - Todos os eventos

## Exemplo Completo

```sql
-- Facebook Pixel
INSERT INTO settings (`key`, `value`) 
VALUES ('tracking.facebookPixelId', '123456789012345')
ON DUPLICATE KEY UPDATE `value` = '123456789012345';

-- Webhook 1 - Todos os eventos
INSERT INTO settings (`key`, `value`) VALUES
('webhook.1.url', 'https://api.exemplo.com/webhook'),
('webhook.1.enabled', 'true'),
('webhook.1.events', '["*"]')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- Webhook 2 - Apenas depósitos pagos
INSERT INTO settings (`key`, `value`) VALUES
('webhook.2.url', 'https://outro-api.com/tracking'),
('webhook.2.enabled', 'true'),
('webhook.2.events', '["deposit_paid", "user_registered"]')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
```

## Desabilitar Webhook

```sql
UPDATE settings SET `value` = 'false' WHERE `key` = 'webhook.1.enabled';
```

## Remover Configuração

```sql
DELETE FROM settings WHERE `key` LIKE 'webhook.1.%';
DELETE FROM settings WHERE `key` = 'tracking.facebookPixelId';
```

