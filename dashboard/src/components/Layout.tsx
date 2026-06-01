import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, CreditCard, Settings, LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PlanBadge } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard, group: 'Studio' },
  { to: '/shops', label: 'Sklepy', icon: Store, group: 'Studio' },
  { to: '/billing', label: 'Płatności', icon: CreditCard, group: 'Studio' },
  { to: '/settings', label: 'Ustawienia', icon: Settings, group: 'System' },
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
  const navGroups = ['Studio', 'System'] as const;

  return (
    <div className="ff-dashboard-ref">
      <header className="appbar">
        <div className="brand">
          <span className="coremark" aria-hidden="true">
            <Shirt size={15} />
          </span>
          <span>FashionFit <span className="sp">AI</span> <small>Studio</small></span>
        </div>

        <nav className="tabs" aria-label="Nawigacja Studio">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="bar-actions">
          {client && (
            <div className="bar-user">
              <b>{client.name}</b>
              <span>{client.email}</span>
            </div>
          )}
          <button onClick={handleLogout} className="barbtn logout" type="button" aria-label="Wyloguj">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="side">
          <button type="button" className="store">
            <span className="av">{storeInitials}</span>
            <span className="store-meta">
              <b>{client?.name || 'FashionFit Store'}</b>
              <span>{client?.email || 'Sklep aktywny'}</span>
            </span>
          </button>

          <nav aria-label="Nawigacja boczna">
            {navGroups.map((groupName) => (
              <div key={groupName}>
                <div className="navg">{groupName}</div>
                {NAV.filter((entry) => entry.group === groupName).map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-i ${isActive ? 'on' : ''}`}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                    {label === 'Sklepy' ? <span className="badge soft">live</span> : null}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="planbox">
            {client && (
              <>
                <div className="planmeta">
                  <b>Plan aktywny</b>
                  <p>Twoje centrum FashionFit Studio</p>
                </div>
                <div className="planbadge">
                  <PlanBadge plan={client.plan} />
                </div>
              </>
            )}
            <button onClick={handleLogout} className="up" type="button">
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
