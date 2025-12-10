import { useState } from "react";
import { api, setAuthToken, setUser } from "../services/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string; id: number; is_admin: boolean }) => void;
};

export function AuthModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function passwordStrength(value: string) {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      setError("Você precisa aceitar os termos para continuar");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (username.length < 3) {
      setError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        username,
        password,
        phone: phone || undefined,
        currency
      });

      setAuthToken(response.data.token);
      setUser(response.data.user);
      onSuccess(response.data.user);
      onClose();
      // Limpar formulário
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setAccepted(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password
      });

      setAuthToken(response.data.token);
      setUser(response.data.user);
      onSuccess(response.data.user);
      onClose();
      // Limpar formulário
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Credenciais inválidas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    if (mode === "login") {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="auth-modal-header modern">
          <div className="auth-title-row">
            <span className="auth-icon">{mode === "login" ? "🔐" : "🧑‍🚀"}</span>
            <div>
              <p className="auth-subtitle">{mode === "login" ? "Acesso rápido" : "Cadastro rápido"}</p>
              <h2>{mode === "login" ? "Faça login" : "Registre sua conta"}</h2>
            </div>
          </div>
        </header>

        <form className="auth-modal-form modern" onSubmit={handleSubmit}>
          <label>
            <span>* Nome de usuário</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Escolha seu usuário"
              required
            />
          </label>

          <label>
            <span>* Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Digite sua senha" : "Crie uma senha forte"}
              required
            />
          </label>

          {mode === "register" && (
            <>
              <div className="password-strength">
                <span>Força</span>
                <div className="strength-bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`strength-bar ${
                        passwordStrength(password) > i ? "filled" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <label>
                <span>* Confirme a senha</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </label>

              <label>
                <span>* Telefone</span>
                <div className="input-group">
                  <span className="input-prefix">+55</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Digite o número do celular"
                    required
                  />
                </div>
              </label>

              <label>
                <span>* Moeda</span>
                <div className="select-flag">
                  <span className="flag">🇧🇷</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="BRL">BRL (BRL)</option>
                  </select>
                </div>
              </label>

              <label className="auth-modal-checkline modern-check">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  Tenho 18 anos, li e concordo com{" "}
                  <button
                    type="button"
                    className="link-inline"
                    onClick={(ev) => ev.preventDefault()}
                  >
                    Acordo do Usuário
                  </button>
                </span>
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn auth-modern-submit"
            disabled={loading || (mode === "register" && !accepted)}
          >
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Registrar"}
          </button>
        </form>

        <footer className="auth-modal-footer modern">
          <button
            type="button"
            className="auth-footer-link"
            onClick={onClose}
          >
            Contactar o suporte
          </button>
          <button
            type="button"
            className="auth-footer-link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </button>
        </footer>
      </div>
    </div>
  );
}

