import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, CreditCard, Settings, LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PlanBadge } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, group: 'Wzrost' },
  { to: '/shops', label: 'Sklepy', icon: Store, group: 'Wzrost' },
  { to: '/billing', label: 'Płatności', icon: CreditCard, group: 'Konto' },
  { to: '/settings', label: 'Ustawienia', icon: Settings, group: 'Konto' },
];

export function Layout() {
  const { client, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const storeInitials = (client?.name || 'FF')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('') || 'FF';
  const navGroups = ['Wzrost', 'Konto'] as const;

  return (
    <div className="ff-app-shell ff-studio-shell min-h-screen pb-24 md:pb-0">
      <header className="ff-studio-appbar">
        <div className="ff-studio-brand">
          <span className="ff-studio-brand-core" aria-hidden="true">
            <Shirt size={16} />
          </span>
          <div>
            <strong>
              FashionFit <span>AI</span>
            </strong>
            <small>Studio</small>
          </div>
        </div>

        <nav className="ff-studio-tabs" aria-label="Nawigacja Studio">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `ff-studio-tab ${isActive ? 'ff-studio-tab-active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ff-studio-appbar-right">
          {client && (
            <div className="ff-studio-user">
              <b>{client.name}</b>
              <span>{client.email}</span>
            </div>
          )}
          <button onClick={handleLogout} className="ff-btn-secondary ff-studio-logout" type="button">
            <LogOut size={15} />
            <span>Wyloguj</span>
          </button>
        </div>
      </header>

      <div className="ff-studio-layout">
        <aside className="ff-studio-side">
          <button type="button" className="ff-studio-store">
            <span className="ff-studio-store-avatar">{storeInitials}</span>
            <span className="ff-studio-store-meta">
              <b>{client?.name || 'FashionFit Store'}</b>
              <span>{client?.email || 'studio@fashionfit.ai'}</span>
            </span>
          </button>

          <nav className="ff-studio-nav" aria-label="Nawigacja boczna">
            {navGroups.map((groupName) => (
              <div key={groupName}>
                <div className="ff-studio-nav-group">{groupName}</div>
                {NAV.filter((entry) => entry.group === groupName).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `ff-nav-link ${isActive ? 'ff-nav-link-active' : 'ff-nav-link-idle'}`
                    }
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="ff-studio-planbox">
            {client && (
              <div className="ff-studio-planmeta">
                <div className="ff-studio-planname">Plan aktywny</div>
                <div className="ff-studio-planbadge">
                  <PlanBadge plan={client.plan} />
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="ff-btn-secondary ff-studio-planlogout" type="button">
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="ff-studio-main">
          <div className="ff-main-wrap ff-studio-main-wrap">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="ff-studio-bottomnav md:hidden" aria-label="Dolna nawigacja">
        <div className="grid grid-cols-4 gap-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `ff-studio-bottomlink ${isActive ? 'ff-studio-bottomlink-active' : ''}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
