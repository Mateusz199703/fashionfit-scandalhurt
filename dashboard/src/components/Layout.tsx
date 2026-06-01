import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const TOP_TABS: Array<{ label: string; to: string }> = [
  { label: 'Pulpit', to: '/dashboard' },
  { label: 'Agent mody', to: '/fashion-agent' },
  { label: 'Przymierzalnia', to: '/try-on' },
  { label: 'System wizualny', to: '/visual-system' },
];

const sideIcon = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l2.5 5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z" />
    </svg>
  ),
  size: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  catalog: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  tryon: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 4-5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  ),
};

type RouteItem = { type: 'route'; label: string; to: string; icon: React.ReactNode; badge?: string; badgeSoft?: boolean };
type GroupItem = { type: 'group'; label: string };
type SideItem = RouteItem | GroupItem;

const SIDE_ITEMS: SideItem[] = [
  { type: 'route', label: 'Pulpit', to: '/dashboard', icon: sideIcon.dashboard },
  { type: 'route', label: 'Rozmowy AI', to: '/ai-conversations', icon: sideIcon.chat, badge: '128' },
  { type: 'route', label: 'Rekomendacje', to: '/recommendations', icon: sideIcon.star },
  { type: 'route', label: 'Dopasowanie rozmiaru', to: '/size-fit', icon: sideIcon.size },
  { type: 'route', label: 'Katalog', to: '/catalog', icon: sideIcon.catalog, badge: '1 240', badgeSoft: true },
  { type: 'route', label: 'Przymierzalnia', to: '/try-on', icon: sideIcon.tryon },
  { type: 'group', label: 'Wzrost' },
  { type: 'route', label: 'Klienci', to: '/customers', icon: sideIcon.customers },
  { type: 'route', label: 'Analityka', to: '/analytics', icon: sideIcon.analytics },
  { type: 'route', label: 'Ustawienia', to: '/settings', icon: sideIcon.settings },
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

  return (
    <div className="ff-dashboard-ref">
      <header className="appbar">
        <div className="brand">
          <span className="core" style={{ width: 28, height: 28 }} aria-hidden="true">
            <svg viewBox="0 0 200 200" width="28" height="28">
              <defs>
                <radialGradient id="ffCoreSph" cx="38%" cy="32%" r="80%">
                  <stop offset="0%" stopColor="#7C8BFF" />
                  <stop offset="45%" stopColor="#5B6CFF" />
                  <stop offset="70%" stopColor="#8B5CFF" />
                  <stop offset="100%" stopColor="#FFB15C" />
                </radialGradient>
              </defs>
              <circle className="sph" cx="100" cy="100" r="42" fill="url(#ffCoreSph)" />
              <g className="frm" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round">
                <path d="M48 64 L48 48 L64 48" />
                <path d="M136 48 L152 48 L152 64" />
                <path d="M152 136 L152 152 L136 152" />
                <path d="M64 152 L48 152 L48 136" />
              </g>
            </svg>
          </span>
          FashionFit <span className="sp">AI</span> <small>Studio</small>
        </div>

        <nav className="tabs" aria-label="Nawigacja Studio">
          {TOP_TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={({ isActive }) => `tab ${isActive ? 'on' : ''}`}
            >
              {tab.label}
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
          <div className="store">
            <div className="av">{storeInitials}</div>
            <div className="store-meta">
              <b>{client?.name || 'Atelier Nord'}</b>
              <span>{client?.email || 'atelier-nord.pl'}</span>
            </div>
            <ChevronDown className="chev" size={16} />
          </div>

          <nav aria-label="Nawigacja boczna">
            {SIDE_ITEMS.map((item) => {
              if (item.type === 'group') {
                return <div key={item.label} className="navg">{item.label}</div>;
              }

              if (item.type === 'route') {
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) => `nav-i ${isActive ? 'on' : ''}`}
                  >
                    {item.icon}
                    {item.label}
                    {item.badge ? <span className={`badge ${item.badgeSoft ? 'soft' : ''}`}>{item.badge}</span> : null}
                  </NavLink>
                );
              }

              return null;
            })}
          </nav>

          <div className="planbox">
            <b>Plan Growth</b>
            <p>Limity i wykorzystanie sprawdzisz w module płatności</p>
            <NavLink className="up" to="/billing">Zwiększ limit →</NavLink>
            {client ? <div className="plan-real-badge"><span className="label">Aktualny plan:</span> <span className="value">{client.plan}</span></div> : null}
            <button onClick={handleLogout} className="plan-logout-btn" type="button" aria-label="Wyloguj">
              <LogOut size={14} />
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
