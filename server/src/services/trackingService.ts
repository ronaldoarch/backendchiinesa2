import axios from "axios";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

export type TrackingEvent = {
  event: string;
  userId?: number;
  username?: string;
  email?: string;
  phone?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
};

export type WebhookConfig = {
  url: string;
  enabled: boolean;
  events: string[]; // Lista de eventos para enviar
};

/**
 * Buscar configurações de webhooks do banco de dados
 */
async function getWebhookConfigs(): Promise<WebhookConfig[]> {
  try {

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT \`key\`, \`value\` FROM settings WHERE \`key\` LIKE 'webhook.%'`
    );

    const configs: Record<string, WebhookConfig> = {};

    rows.forEach((row: any) => {
      const key = row.key.replace("webhook.", "");
      const parts = key.split(".");
      
      if (parts.length >= 2) {
        const webhookId = parts[0];
        const configKey = parts[1];

        if (!configs[webhookId]) {
          configs[webhookId] = {
            url: "",
            enabled: false,
            events: []
          };
        }

        if (configKey === "url") {
          configs[webhookId].url = row.value;
        } else if (configKey === "enabled") {
          configs[webhookId].enabled = row.value === "true" || row.value === "1";
        } else if (configKey === "events") {
          try {
            configs[webhookId].events = JSON.parse(row.value);
          } catch {
            configs[webhookId].events = [];
          }
        }
      }
    });

    return Object.values(configs).filter((config) => config.enabled && config.url);
  } catch (error) {
    console.error("Erro ao buscar configurações de webhook:", error);
    return [];
  }
}

/**
 * Enviar evento para webhooks configurados
 */
export async function trackEvent(event: TrackingEvent): Promise<void> {
  try {
    const webhooks = await getWebhookConfigs();

    // Filtrar webhooks que devem receber este evento
    const relevantWebhooks = webhooks.filter((webhook) =>
      webhook.events.includes(event.event) || webhook.events.includes("*")
    );

    // Enviar para cada webhook em paralelo (não bloquear se um falhar)
    await Promise.allSettled(
      relevantWebhooks.map(async (webhook) => {
        try {
          await axios.post(webhook.url, {
            ...event,
            timestamp: new Date().toISOString(),
            source: "turbo-bet"
          }, {
            timeout: 5000,
            headers: {
              "Content-Type": "application/json"
            }
          });
          console.log(`✅ Evento ${event.event} enviado para webhook: ${webhook.url}`);
        } catch (error: any) {
          console.error(`❌ Erro ao enviar evento para webhook ${webhook.url}:`, error.message);
        }
      })
    );
  } catch (error) {
    console.error("Erro ao processar tracking:", error);
  }
}

/**
 * Eventos pré-definidos
 */
export const TrackingEvents = {
  USER_REGISTERED: "user_registered",
  USER_LOGIN: "user_login",
  DEPOSIT_CREATED: "deposit_created",
  DEPOSIT_PAID: "deposit_paid",
  DEPOSIT_FAILED: "deposit_failed",
  WITHDRAWAL_CREATED: "withdrawal_created",
  WITHDRAWAL_PAID: "withdrawal_paid",
  GAME_LAUNCHED: "game_launched",
  PAGE_VIEW: "page_view"
};

