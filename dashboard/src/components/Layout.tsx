import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, CreditCard, Settings, LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PlanBadge } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, group: 'Wzrost' },
  { to: '/shops', label: 'Sklepy', icon: Store, group: 'Wzrost' },
  { to: '/billing', label: 'Billing', icon: CreditCard, group: 'Wzrost' },
  { to: '/settings', label: 'Ustawienia', icon: Settings, group: 'Studio' },
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
  const navGroups = ['Wzrost', 'Studio'] as const;

  return (
    <div className="ff-studio-shell min-h-screen pb-20 md:pb-0">
      <header className="ff-studio-appbar">
        <div className="ff-studio-brand">
          <span className="ff-studio-brand-core" aria-hidden="true">
            <Shirt size={15} />
          </span>
          <span>
            <strong>
              FashionFit <span>AI</span>
            </strong>
            <small>Studio</small>
          </span>
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
          <button onClick={handleLogout} className="ff-btn ff-studio-logout" type="button" aria-label="Wyloguj">
            <LogOut size={16} />
            <span>Wyloguj</span>
          </button>
        </div>
      </header>

      <div className="ff-studio-layout">
        <aside className="ff-studio-side">
          <button type="button" className="ff-studio-store">
            <span className="ff-studio-store-avatar">{storeInitials}</span>
            <span>
              <span className="ff-studio-store-meta">
                <b>{client?.name || 'FashionFit Store'}</b>
                <span>{client?.email || 'Sklep aktywny'}</span>
              </span>
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
                    {label === 'Sklepy' ? <span className="badge">AI</span> : null}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="ff-studio-planbox">
            {client && (
              <>
                <div className="ff-studio-planmeta">
                  <b>Plan aktywny</b>
                  <p className="ff-studio-planname">Twoje centrum FashionFit Studio</p>
                </div>
                <div className="ff-studio-planbadge">
                  <PlanBadge plan={client.plan} />
                </div>
              </>
            )}
            <button onClick={handleLogout} className="ff-btn ff-studio-planlogout" type="button">
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="ff-studio-main">
          <div className="ff-studio-main-wrap">
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
