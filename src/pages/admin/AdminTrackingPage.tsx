import { useState, useEffect } from "react";
import { api } from "../../services/api";

type WebhookConfig = {
  id: string;
  url: string;
  enabled: boolean;
  events: string[];
};

export function AdminTrackingPage() {
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [utmfyApiKey, setUtmfyApiKey] = useState("");
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    url: "",
    enabled: true,
    events: ["*"]
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const response = await api.get<Record<string, string>>("/settings");
      const settings = response.data;

      setFacebookPixelId(settings["tracking.facebookPixelId"] || "");
      setUtmfyApiKey(settings["tracking.utmfyApiKey"] || "");

      // Carregar webhooks
      const webhookIds = new Set<string>();
      Object.keys(settings).forEach((key) => {
        if (key.startsWith("webhook.")) {
          const parts = key.split(".");
          if (parts.length >= 2) {
            webhookIds.add(parts[1]);
          }
        }
      });

      const loadedWebhooks: WebhookConfig[] = [];
      webhookIds.forEach((id) => {
        const url = settings[`webhook.${id}.url`] || "";
        const enabled = settings[`webhook.${id}.enabled`] === "true" || settings[`webhook.${id}.enabled`] === "1";
        let events: string[] = [];
        try {
          events = JSON.parse(settings[`webhook.${id}.events`] || "[]");
        } catch {
          events = [];
        }

        if (url) {
          loadedWebhooks.push({ id, url, enabled, events });
        }
      });

      setWebhooks(loadedWebhooks);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setMessage({ type: "error", text: "Erro ao carregar configurações" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFacebookPixel() {
    try {
      setSaving(true);
      await api.put("/settings", {
        "tracking.facebookPixelId": facebookPixelId
      });
      setMessage({ type: "success", text: "Facebook Pixel configurado com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao salvar configuração" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveUtmfy() {
    try {
      setSaving(true);
      await api.put("/settings", {
        "tracking.utmfyApiKey": utmfyApiKey
      });
      setMessage({ type: "success", text: "UTMfy configurado com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao salvar configuração" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWebhook() {
    if (!newWebhook.url) {
      setMessage({ type: "error", text: "URL do webhook é obrigatória" });
      return;
    }

    try {
      setSaving(true);
      const webhookId = `webhook_${Date.now()}`;
      
      await api.put("/settings", {
        [`webhook.${webhookId}.url`]: newWebhook.url,
        [`webhook.${webhookId}.enabled`]: String(newWebhook.enabled || false),
        [`webhook.${webhookId}.events`]: JSON.stringify(newWebhook.events || [])
      });

      setMessage({ type: "success", text: "Webhook adicionado com sucesso!" });
      setNewWebhook({ url: "", enabled: true, events: ["*"] });
      setTimeout(() => setMessage(null), 3000);
      loadSettings();
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao adicionar webhook" });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateWebhook(webhookId: string, updates: Partial<WebhookConfig>) {
    try {
      setSaving(true);
      const updateData: Record<string, string> = {};
      
      if (updates.url !== undefined) {
        updateData[`webhook.${webhookId}.url`] = updates.url;
      }
      if (updates.enabled !== undefined) {
        updateData[`webhook.${webhookId}.enabled`] = String(updates.enabled);
      }
      if (updates.events !== undefined) {
        updateData[`webhook.${webhookId}.events`] = JSON.stringify(updates.events);
      }

      await api.put("/settings", updateData);
      setMessage({ type: "success", text: "Webhook atualizado com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
      loadSettings();
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao atualizar webhook" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWebhook(webhookId: string) {
    if (!confirm("Tem certeza que deseja remover este webhook?")) return;

    try {
      setSaving(true);
      // Remover via PUT com valores vazios/null
      await api.put("/settings", {
        [`webhook.${webhookId}.url`]: "",
        [`webhook.${webhookId}.enabled`]: "false",
        [`webhook.${webhookId}.events`]: "[]"
      });
      
      setMessage({ type: "success", text: "Webhook removido com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
      loadSettings();
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao remover webhook" });
    } finally {
      setSaving(false);
    }
  }

  const availableEvents = [
    { value: "*", label: "Todos os eventos" },
    { value: "user_registered", label: "Usuário Registrado" },
    { value: "user_login", label: "Usuário Fez Login" },
    { value: "deposit_created", label: "Depósito Criado" },
    { value: "deposit_paid", label: "Depósito Pago" },
    { value: "deposit_failed", label: "Depósito Falhou" },
    { value: "withdrawal_paid", label: "Saque Processado" },
    { value: "game_launched", label: "Jogo Iniciado" }
  ];

  if (loading) {
    return (
      <section className="admin-section">
        <h1>Tracking & Webhooks</h1>
        <p style={{ color: "var(--text-muted)" }}>Carregando...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Tracking & Webhooks</h1>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: message.type === "success" ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 59, 48, 0.1)",
            border: `1px solid ${message.type === "success" ? "rgba(52, 199, 89, 0.3)" : "rgba(255, 59, 48, 0.3)"}`,
            color: message.type === "success" ? "#90ee90" : "#ffc7c7"
          }}
        >
          {message.text}
        </div>
      )}

      {/* Facebook Pixel */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          Facebook Pixel (Meta)
        </h2>
        <div className="admin-form-group">
          <label className="admin-label">Facebook Pixel ID</label>
          <input
            type="text"
            value={facebookPixelId}
            onChange={(e) => setFacebookPixelId(e.target.value)}
            placeholder="Ex: 123456789012345"
            style={{ maxWidth: "400px" }}
          />
          <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
            Encontre seu Pixel ID no Facebook Events Manager
          </small>
        </div>
        <button
          onClick={handleSaveFacebookPixel}
          disabled={saving}
          className="admin-form-button"
          style={{ marginTop: "8px" }}
        >
          {saving ? "Salvando..." : "Salvar Facebook Pixel"}
        </button>
      </div>

      {/* UTMfy */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          UTMfy
        </h2>
        <div className="admin-form-group">
          <label className="admin-label">UTMfy API Key</label>
          <input
            type="text"
            value={utmfyApiKey}
            onChange={(e) => setUtmfyApiKey(e.target.value)}
            placeholder="Sua chave API do UTMfy"
            style={{ maxWidth: "400px" }}
          />
          <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
            Configure sua API Key do UTMfy para tracking avançado de UTMs
          </small>
        </div>
        <button
          onClick={handleSaveUtmfy}
          disabled={saving}
          className="admin-form-button"
          style={{ marginTop: "8px" }}
        >
          {saving ? "Salvando..." : "Salvar UTMfy"}
        </button>
      </div>

      {/* Webhooks */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          Webhooks de Tracking
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "16px" }}>
          Configure webhooks para receber notificações de eventos em tempo real
        </p>

        {/* Adicionar novo webhook */}
        <div style={{ 
          padding: "16px", 
          background: "rgba(246, 196, 83, 0.05)", 
          borderRadius: "8px", 
          marginBottom: "24px",
          border: "1px solid rgba(246, 196, 83, 0.2)"
        }}>
          <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--gold)" }}>
            Adicionar Novo Webhook
          </h3>
          <div className="admin-form-group">
            <label className="admin-label">URL do Webhook</label>
            <input
              type="url"
              value={newWebhook.url || ""}
              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              placeholder="https://seu-webhook.com/endpoint"
              style={{ width: "100%", maxWidth: "500px" }}
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Eventos</label>
            <select
              multiple
              value={newWebhook.events || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                setNewWebhook({ ...newWebhook, events: selected });
              }}
              style={{ 
                width: "100%", 
                maxWidth: "500px", 
                minHeight: "120px",
                background: "#050509",
                color: "var(--text-main)"
              }}
            >
              {availableEvents.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
              Segure Ctrl/Cmd para selecionar múltiplos eventos. Use "*" para todos.
            </small>
          </div>
          <div className="checkbox-line">
            <input
              type="checkbox"
              checked={newWebhook.enabled || false}
              onChange={(e) => setNewWebhook({ ...newWebhook, enabled: e.target.checked })}
            />
            <span>Habilitado</span>
          </div>
          <button
            onClick={handleAddWebhook}
            disabled={saving || !newWebhook.url}
            className="admin-form-button"
            style={{ marginTop: "12px" }}
          >
            {saving ? "Adicionando..." : "Adicionar Webhook"}
          </button>
        </div>

        {/* Lista de webhooks */}
        {webhooks.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Nenhum webhook configurado. Adicione um webhook acima.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                style={{
                  padding: "16px",
                  background: "var(--bg-card)",
                  borderRadius: "8px",
                  border: `1px solid ${webhook.enabled ? "rgba(246, 196, 83, 0.3)" : "rgba(255, 255, 255, 0.1)"}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--gold)" }}>Webhook #{webhook.id}</strong>
                      {webhook.enabled ? (
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "4px", 
                          background: "rgba(52, 199, 89, 0.2)",
                          color: "#90ee90",
                          fontSize: "10px"
                        }}>
                          Ativo
                        </span>
                      ) : (
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "4px", 
                          background: "rgba(255, 59, 48, 0.2)",
                          color: "#ffc7c7",
                          fontSize: "10px"
                        }}>
                          Inativo
                        </span>
                      )}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "8px" }}>
                      {webhook.url}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      <strong>Eventos:</strong> {webhook.events.join(", ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleUpdateWebhook(webhook.id, { enabled: !webhook.enabled })}
                      disabled={saving}
                      style={{
                        padding: "6px 12px",
                        background: webhook.enabled ? "rgba(255, 59, 48, 0.1)" : "rgba(52, 199, 89, 0.1)",
                        border: `1px solid ${webhook.enabled ? "rgba(255, 59, 48, 0.3)" : "rgba(52, 199, 89, 0.3)"}`,
                        borderRadius: "6px",
                        color: webhook.enabled ? "#ffc7c7" : "#90ee90",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontSize: "11px"
                      }}
                    >
                      {webhook.enabled ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      disabled={saving}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 59, 48, 0.1)",
                        border: "1px solid rgba(255, 59, 48, 0.3)",
                        borderRadius: "6px",
                        color: "#ffc7c7",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontSize: "11px"
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div style={{ 
        padding: "16px", 
        background: "rgba(246, 196, 83, 0.05)", 
        borderRadius: "8px",
        border: "1px solid rgba(246, 196, 83, 0.2)"
      }}>
        <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--gold)" }}>
          ℹ️ Informações
        </h3>
        <ul style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.6", paddingLeft: "20px" }}>
          <li><strong>Facebook Pixel:</strong> Rastreia conversões e eventos no Facebook Ads</li>
          <li><strong>UTMfy:</strong> Tracking avançado de parâmetros UTM e atribuição</li>
          <li><strong>Webhooks:</strong> Receba notificações em tempo real de eventos importantes</li>
          <li>Os webhooks recebem um payload JSON com os dados do evento</li>
          <li>Use "*" nos eventos para receber todas as notificações</li>
        </ul>
      </div>
    </section>
  );
}

