import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { logout } from "../../services/authService";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "../common/ThemeToggle";

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export function PortalLayout({
  navItems,
  portalName,
  children,
}: {
  navItems: NavItem[];
  portalName: string;
  children: ReactNode;
}) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to sign out.",
        "error"
      );
    }
  }

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="portal-sidebar__brand">
          <span className="portal-sidebar__logo">CF</span>
          <div>
            <div className="portal-sidebar__title">CampusFix</div>
            <div className="portal-sidebar__subtitle">{portalName}</div>
          </div>
        </div>
        <nav className="portal-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `portal-sidebar__link ${isActive ? "is-active" : ""}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="portal-sidebar__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="portal-sidebar__signout" onClick={handleSignOut}>
          ⎋ Sign Out
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="portal-sidebar__backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="portal-main">
        <header className="portal-topbar">
          <button
            className="portal-topbar__menu"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="portal-topbar__spacer" />
          <ThemeToggle />
          <NotificationBell />
          <div className="portal-topbar__user">
            <div className="portal-topbar__avatar">
              {profile?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="portal-topbar__name">{profile?.name}</div>
              <div className="portal-topbar__role">{profile?.role}</div>
            </div>
          </div>
        </header>
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
