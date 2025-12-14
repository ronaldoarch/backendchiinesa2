import { useState, useEffect } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { AdminDashboardPage } from "./admin/AdminDashboardPage";
import { AdminBrandingPage } from "./admin/AdminBrandingPage";
import { AdminPlayfiversPage } from "./admin/AdminPlayfiversPage";
import { AdminBannersPage } from "./admin/AdminBannersPage";
import { AdminUsersPage } from "./admin/AdminUsersPage";
import { AdminDepositsPage } from "./admin/AdminDepositsPage";
import { AdminPromotionsPage } from "./admin/AdminPromotionsPage";
import { AdminSuitPayPage } from "./admin/AdminSuitPayPage";
import { AdminTrackingPage } from "./admin/AdminTrackingPage";

export function AdminPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Fechar menu ao clicar fora (mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (menuOpen && !target.closest(".admin-menu") && !target.closest(".admin-menu-toggle")) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="admin-shell">
      {menuOpen && (
        <div 
          className="admin-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside className={`admin-menu ${menuOpen ? "open" : ""}`}>
        <h2 className="admin-menu-title">Painel Admin</h2>
        <nav className="admin-menu-list">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/branding"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Logo & Favicon
          </NavLink>
          <NavLink
            to="/admin/playfivers"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            PlayFivers
          </NavLink>
          <NavLink
            to="/admin/banners"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Banners
          </NavLink>
          <NavLink
            to="/admin/usuarios"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Usuários
          </NavLink>
          <NavLink
            to="/admin/depositos"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Depósitos
          </NavLink>
          <NavLink
            to="/admin/promocoes"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Promoções
          </NavLink>
          <NavLink
            to="/admin/suitpay"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            SuitPay
          </NavLink>
          <NavLink
            to="/admin/tracking"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Tracking
          </NavLink>
        </nav>
      </aside>

      <div className="admin-layout">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="branding" element={<AdminBrandingPage />} />
          <Route path="playfivers" element={<AdminPlayfiversPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="usuarios" element={<AdminUsersPage />} />
          <Route path="depositos" element={<AdminDepositsPage />} />
          <Route path="promocoes" element={<AdminPromotionsPage />} />
          <Route path="suitpay" element={<AdminSuitPayPage />} />
          <Route path="tracking" element={<AdminTrackingPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

