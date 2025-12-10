import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { DepositPage } from "./pages/DepositPage";
import { SupportPage } from "./pages/SupportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SideMenu } from "./components/SideMenu";
import { AuthModal } from "./components/AuthModal";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getUser, removeAuthToken, api } from "./services/api";

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; id: number; is_admin: boolean } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Verificar autenticação ao carregar
  useEffect(() => {
    async function checkAuth() {
      const savedUser = getUser();
      const token = localStorage.getItem("token");

      if (token && savedUser) {
        try {
          // Verificar se o token ainda é válido
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch {
          // Token inválido, limpar
          removeAuthToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  return (
    <div className={`app-root${isAdmin ? " app-root-admin" : ""}`}>
      <header className="top-bar">
        <div className="top-bar-left">
          <button
            className="icon-button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="logo-text">BIGBET777</span>
        </div>
        <div className="top-bar-right">
          {user ? (
            <>
              <span className="user-pill">Olá, {user.username}</span>
              {user.is_admin && (
                <NavLink to="/admin" className="btn btn-ghost">
                  Admin
                </NavLink>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => {
                  removeAuthToken();
                  setUser(null);
                  if (isAdmin) {
                    window.location.href = "/";
                  }
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setAuthOpen(true)}
              >
                Login
              </button>
              <button
                className="btn btn-gold"
                onClick={() => setAuthOpen(true)}
              >
                Registro
              </button>
            </>
          )}
        </div>
      </header>

      {!isAdmin && (
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <main className="app-main">
        {!loading && (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/promocoes"
              element={
                <PromotionsPage
                  user={user}
                  onRequireAuth={() => setAuthOpen(true)}
                />
              }
            />
            <Route path="/deposito" element={<DepositPage />} />
            <Route path="/suporte" element={<SupportPage />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </main>

      {!isAdmin && (
        <nav className="bottom-nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🏠</span>
            <span className="bottom-nav-label">Início</span>
          </NavLink>
          <NavLink
            to="/promocoes"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🎁</span>
            <span className="bottom-nav-label">Promoção</span>
          </NavLink>
          <NavLink
            to="/deposito"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">💳</span>
            <span className="bottom-nav-label">Depósito</span>
          </NavLink>
          <NavLink
            to="/suporte"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🎧</span>
            <span className="bottom-nav-label">Suporte</span>
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">Perfil</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}


