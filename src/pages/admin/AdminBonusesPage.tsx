import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Bonus = {
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
  createdAt: string;
  updatedAt: string;
};

export function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [formData, setFormData] = useState<Partial<Bonus>>({
    name: "",
    type: "first_deposit",
    bonusPercentage: 100,
    bonusFixed: 0,
    minDeposit: 0,
    maxBonus: null,
    rolloverMultiplier: 1,
    rtpPercentage: 96,
    active: true,
    vipLevelRequired: null
  });

  useEffect(() => {
    loadBonuses();
  }, []);

  async function loadBonuses() {
    try {
      setLoading(true);
      const response = await api.get<Bonus[]>("/bonuses");
      setBonuses(response.data);
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao carregar bônus" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name) {
      setMessage({ type: "error", text: "Nome do bônus é obrigatório" });
      return;
    }

    try {
      setSaving(true);
      if (editingBonus) {
        await api.put(`/bonuses/${editingBonus.id}`, formData);
        setMessage({ type: "success", text: "Bônus atualizado com sucesso!" });
      } else {
        await api.post("/bonuses", formData);
        setMessage({ type: "success", text: "Bônus criado com sucesso!" });
      }
      setTimeout(() => setMessage(null), 3000);
      resetForm();
      loadBonuses();
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao salvar bônus" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja remover este bônus?")) return;

    try {
      setSaving(true);
      await api.delete(`/bonuses/${id}`);
      setMessage({ type: "success", text: "Bônus removido com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
      loadBonuses();
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.error || "Erro ao remover bônus" });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingBonus(null);
    setFormData({
      name: "",
      type: "first_deposit",
      bonusPercentage: 100,
      bonusFixed: 0,
      minDeposit: 0,
      maxBonus: null,
      rolloverMultiplier: 1,
      rtpPercentage: 96,
      active: true,
      vipLevelRequired: null
    });
  }

  function handleEdit(bonus: Bonus) {
    setEditingBonus(bonus);
    setFormData({
      name: bonus.name,
      type: bonus.type,
      bonusPercentage: bonus.bonusPercentage,
      bonusFixed: bonus.bonusFixed,
      minDeposit: bonus.minDeposit,
      maxBonus: bonus.maxBonus,
      rolloverMultiplier: bonus.rolloverMultiplier,
      rtpPercentage: bonus.rtpPercentage,
      active: bonus.active,
      vipLevelRequired: bonus.vipLevelRequired
    });
  }

  if (loading) {
    return (
      <section className="admin-section">
        <h1>Gerenciar Bônus</h1>
        <p style={{ color: "var(--text-muted)" }}>Carregando...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Gerenciar Bônus</h1>

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

      {/* Formulário */}
      <div style={{ marginBottom: "32px", padding: "16px", background: "rgba(246, 196, 83, 0.05)", borderRadius: "8px", border: "1px solid rgba(246, 196, 83, 0.2)" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          {editingBonus ? "Editar Bônus" : "Criar Novo Bônus"}
        </h2>

        <div className="admin-form-group">
          <label className="admin-label">Nome do Bônus</label>
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Bônus do Primeiro Depósito"
            style={{ maxWidth: "400px" }}
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Tipo</label>
          <select
            value={formData.type || "first_deposit"}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            style={{ maxWidth: "400px" }}
          >
            <option value="first_deposit">Primeiro Depósito</option>
            <option value="deposit">Depósito Geral</option>
            <option value="vip_level">Nível VIP</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="admin-form-group">
            <label className="admin-label">Percentual de Bônus (%)</label>
            <input
              type="number"
              value={formData.bonusPercentage || 0}
              onChange={(e) => setFormData({ ...formData, bonusPercentage: parseFloat(e.target.value) || 0 })}
              min="0"
              max="1000"
              step="0.01"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Ex: 100 = dobra o valor depositado
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Valor Fixo de Bônus (R$)</label>
            <input
              type="number"
              value={formData.bonusFixed || 0}
              onChange={(e) => setFormData({ ...formData, bonusFixed: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Valor fixo adicional (opcional)
            </small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="admin-form-group">
            <label className="admin-label">Depósito Mínimo (R$)</label>
            <input
              type="number"
              value={formData.minDeposit || 0}
              onChange={(e) => setFormData({ ...formData, minDeposit: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Bônus Máximo (R$)</label>
            <input
              type="number"
              value={formData.maxBonus || ""}
              onChange={(e) => setFormData({ ...formData, maxBonus: e.target.value ? parseFloat(e.target.value) : null })}
              min="0"
              step="0.01"
              placeholder="Sem limite"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Deixe vazio para sem limite
            </small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
          <div className="admin-form-group">
            <label className="admin-label">Multiplicador de Rollover</label>
            <input
              type="number"
              value={formData.rolloverMultiplier || 1}
              onChange={(e) => setFormData({ ...formData, rolloverMultiplier: parseFloat(e.target.value) || 1 })}
              min="0.1"
              step="0.1"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Ex: 1 = precisa apostar o valor do depósito + bônus
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">RTP (%)</label>
            <input
              type="number"
              value={formData.rtpPercentage || 96}
              onChange={(e) => setFormData({ ...formData, rtpPercentage: parseFloat(e.target.value) || 96 })}
              min="0"
              max="100"
              step="0.01"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              Return to Player (taxa de retorno)
            </small>
          </div>
        </div>

        {formData.type === "vip_level" && (
          <div className="admin-form-group">
            <label className="admin-label">Nível VIP Requerido</label>
            <input
              type="number"
              value={formData.vipLevelRequired || ""}
              onChange={(e) => setFormData({ ...formData, vipLevelRequired: e.target.value ? parseInt(e.target.value) : null })}
              min="0"
              placeholder="Qualquer nível"
            />
          </div>
        )}

        <div className="checkbox-line">
          <input
            type="checkbox"
            checked={formData.active !== false}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          />
          <span>Ativo</span>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={handleSave} disabled={saving} className="admin-form-button">
            {saving ? "Salvando..." : editingBonus ? "Atualizar" : "Criar Bônus"}
          </button>
          {editingBonus && (
            <button onClick={resetForm} className="admin-form-button" style={{ background: "rgba(255, 59, 48, 0.1)", color: "#ffc7c7", border: "1px solid rgba(255, 59, 48, 0.3)" }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista de bônus */}
      <div>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          Bônus Configurados ({bonuses.length})
        </h2>

        {bonuses.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            Nenhum bônus configurado. Crie um bônus acima.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Bônus</th>
                  <th>Dep. Mín.</th>
                  <th>Rollover</th>
                  <th>RTP</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {bonuses.map((bonus) => (
                  <tr key={bonus.id}>
                    <td>{bonus.name}</td>
                    <td>
                      {bonus.type === "first_deposit" && "Primeiro Depósito"}
                      {bonus.type === "deposit" && "Depósito"}
                      {bonus.type === "vip_level" && "VIP"}
                      {bonus.type === "custom" && "Personalizado"}
                    </td>
                    <td>
                      {bonus.bonusPercentage > 0 && `${bonus.bonusPercentage}%`}
                      {bonus.bonusPercentage > 0 && bonus.bonusFixed > 0 && " + "}
                      {bonus.bonusFixed > 0 && `R$ ${bonus.bonusFixed.toFixed(2)}`}
                      {bonus.maxBonus && ` (máx: R$ ${bonus.maxBonus.toFixed(2)})`}
                    </td>
                    <td>R$ {bonus.minDeposit.toFixed(2)}</td>
                    <td>{bonus.rolloverMultiplier}x</td>
                    <td>{bonus.rtpPercentage}%</td>
                    <td>
                      {bonus.active ? (
                        <span style={{ color: "#90ee90" }}>Ativo</span>
                      ) : (
                        <span style={{ color: "#ffc7c7" }}>Inativo</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(bonus)}
                          style={{
                            padding: "4px 8px",
                            background: "rgba(246, 196, 83, 0.1)",
                            border: "1px solid rgba(246, 196, 83, 0.3)",
                            borderRadius: "4px",
                            color: "var(--gold)",
                            cursor: "pointer",
                            fontSize: "11px"
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(bonus.id)}
                          style={{
                            padding: "4px 8px",
                            background: "rgba(255, 59, 48, 0.1)",
                            border: "1px solid rgba(255, 59, 48, 0.3)",
                            borderRadius: "4px",
                            color: "#ffc7c7",
                            cursor: "pointer",
                            fontSize: "11px"
                          }}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

