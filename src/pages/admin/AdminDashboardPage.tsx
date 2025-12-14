import { useState, useEffect } from "react";
import { api } from "../../services/api";

type DashboardStats = {
  totalDeposits: number;
  totalDepositsToday: number;
  totalUsers: number;
  newUsersToday: number;
  conversionRate: number;
  ftdToday: number;
  totalWithdrawals: number;
  totalWithdrawalsToday: number;
  activeUsers: number;
  averageDeposit: number;
  depositsByStatus: {
    pending: number;
    paid: number;
    failed: number;
    canceled: number;
  };
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const response = await api.get<DashboardStats>("/stats/dashboard");
      setStats(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
      setError("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !stats) {
    return (
      <section className="admin-section">
        <h1>Dashboard</h1>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Carregando estatísticas...
        </div>
      </section>
    );
  }

  if (error && !stats) {
    return (
      <section className="admin-section">
        <h1>Dashboard</h1>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--error)" }}>
          {error}
          <br />
          <button
            onClick={loadStats}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              background: "var(--gold)",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  const statsData = stats || {
    totalDeposits: 0,
    totalDepositsToday: 0,
    totalUsers: 0,
    newUsersToday: 0,
    conversionRate: 0,
    ftdToday: 0,
    totalWithdrawals: 0,
    totalWithdrawalsToday: 0,
    activeUsers: 0,
    averageDeposit: 0,
    depositsByStatus: { pending: 0, paid: 0, failed: 0, canceled: 0 }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  return (
    <section className="admin-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Dashboard</h1>
        <button
          onClick={loadStats}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "rgba(246, 196, 83, 0.1)",
            border: "1px solid rgba(246, 196, 83, 0.3)",
            borderRadius: "8px",
            color: "var(--gold)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Atualizando..." : "🔄 Atualizar"}
        </button>
      </div>

      {/* Cards principais */}
      <div className="admin-dashboard-grid">
        <div className="admin-card admin-card-primary">
          <div className="admin-card-icon">💰</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Total de Depósitos</span>
            <strong className="admin-card-value">{formatCurrency(statsData.totalDeposits)}</strong>
            <span className="admin-card-subtitle">
              Hoje: {formatCurrency(statsData.totalDepositsToday)}
            </span>
          </div>
        </div>

        <div className="admin-card admin-card-success">
          <div className="admin-card-icon">👥</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Total de Usuários</span>
            <strong className="admin-card-value">{formatNumber(statsData.totalUsers)}</strong>
            <span className="admin-card-subtitle">
              Novos hoje: {formatNumber(statsData.newUsersToday)}
            </span>
          </div>
        </div>

        <div className="admin-card admin-card-info">
          <div className="admin-card-icon">📊</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Taxa de Conversão</span>
            <strong className="admin-card-value">{statsData.conversionRate.toFixed(2)}%</strong>
            <span className="admin-card-subtitle">
              Usuários que depositaram
            </span>
          </div>
        </div>

        <div className="admin-card admin-card-warning">
          <div className="admin-card-icon">🎯</div>
          <div className="admin-card-content">
            <span className="admin-card-label">FTD Hoje</span>
            <strong className="admin-card-value">{formatNumber(statsData.ftdToday)}</strong>
            <span className="admin-card-subtitle">
              First Time Deposits
            </span>
          </div>
        </div>
      </div>

      {/* Segunda linha de cards */}
      <div className="admin-dashboard-grid" style={{ marginTop: "16px" }}>
        <div className="admin-card">
          <div className="admin-card-icon">💸</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Total de Saques</span>
            <strong className="admin-card-value">{formatCurrency(statsData.totalWithdrawals)}</strong>
            <span className="admin-card-subtitle">
              Hoje: {formatCurrency(statsData.totalWithdrawalsToday)}
            </span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon">⚡</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Usuários Ativos</span>
            <strong className="admin-card-value">{formatNumber(statsData.activeUsers)}</strong>
            <span className="admin-card-subtitle">
              Últimos 30 dias
            </span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon">📈</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Ticket Médio</span>
            <strong className="admin-card-value">{formatCurrency(statsData.averageDeposit)}</strong>
            <span className="admin-card-subtitle">
              Média por depósito
            </span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-icon">📋</div>
          <div className="admin-card-content">
            <span className="admin-card-label">Status dos Depósitos</span>
            <div style={{ marginTop: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>✅ Pagos:</span>
                <strong>{statsData.depositsByStatus.paid}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>⏳ Pendentes:</span>
                <strong>{statsData.depositsByStatus.pending}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>❌ Falhados:</span>
                <strong>{statsData.depositsByStatus.failed}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
