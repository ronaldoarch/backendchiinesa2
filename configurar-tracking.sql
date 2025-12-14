-- ============================================
-- Script para configurar Tracking e Facebook Pixel
-- Execute este script no banco de dados MySQL (Railway)
-- ============================================

-- A tabela 'settings' já existe, então vamos apenas inserir/atualizar as configurações

-- ============================================
-- 1. CONFIGURAR FACEBOOK PIXEL
-- ============================================
-- Substitua 'SEU_PIXEL_ID_AQUI' pelo seu ID do Facebook Pixel
INSERT INTO settings (`key`, `value`) 
VALUES ('tracking.facebookPixelId', 'SEU_PIXEL_ID_AQUI')
ON DUPLICATE KEY UPDATE `value` = 'SEU_PIXEL_ID_AQUI';

-- ============================================
-- 2. CONFIGURAR WEBHOOK DE TRACKING (Exemplo 1)
-- ============================================
-- Substitua 'https://seu-webhook.com/endpoint' pela URL do seu webhook
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.url', 'https://seu-webhook.com/endpoint')
ON DUPLICATE KEY UPDATE `value` = 'https://seu-webhook.com/endpoint';

INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.enabled', 'true')
ON DUPLICATE KEY UPDATE `value` = 'true';

-- Eventos: ["user_registered", "user_login", "deposit_created", "deposit_paid", "deposit_failed", "withdrawal_paid"]
-- Use "*" para receber todos os eventos
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.1.events', '["*"]')
ON DUPLICATE KEY UPDATE `value` = '["*"]';

-- ============================================
-- 3. CONFIGURAR WEBHOOK DE TRACKING (Exemplo 2 - Opcional)
-- ============================================
-- Você pode adicionar múltiplos webhooks
INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.2.url', 'https://outro-webhook.com/endpoint')
ON DUPLICATE KEY UPDATE `value` = 'https://outro-webhook.com/endpoint';

INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.2.enabled', 'false')
ON DUPLICATE KEY UPDATE `value` = 'false';

INSERT INTO settings (`key`, `value`) 
VALUES ('webhook.2.events', '["deposit_paid", "user_registered"]')
ON DUPLICATE KEY UPDATE `value` = '["deposit_paid", "user_registered"]';

-- ============================================
-- 4. VERIFICAR CONFIGURAÇÕES
-- ============================================
-- Execute este SELECT para ver todas as configurações de tracking
SELECT `key`, `value` FROM settings 
WHERE `key` LIKE 'tracking.%' OR `key` LIKE 'webhook.%'
ORDER BY `key`;

-- ============================================
-- 5. DESABILITAR WEBHOOK (se necessário)
-- ============================================
-- UPDATE settings SET `value` = 'false' WHERE `key` = 'webhook.1.enabled';

-- ============================================
-- 6. REMOVER CONFIGURAÇÃO (se necessário)
-- ============================================
-- DELETE FROM settings WHERE `key` LIKE 'webhook.1.%';
-- DELETE FROM settings WHERE `key` = 'tracking.facebookPixelId';

