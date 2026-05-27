import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, CreditCard, Settings, LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PlanBadge } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/shops', label: 'Sklepy', icon: Store },
  { to: '/billing', label: 'Płatności', icon: CreditCard },
  { to: '/settings', label: 'Ustawienia', icon: Settings },
];

export function Layout() {
  const { client, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen pb-20 md:pb-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow">
              <Shirt size={18} />
            </span>
            <span className="text-base font-semibold tracking-tight">FashionFit Studio</span>
          </div>
          <button onClick={handleLogout} className="ff-btn-secondary px-3 py-2 text-xs">
            <LogOut size={14} /> Wyloguj
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 md:py-8">
        <aside className="hidden w-72 flex-col gap-6 md:flex">
          <div className="ff-card p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow">
                <Shirt size={19} />
              </span>
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-ink/50">Control Panel</div>
                <div className="text-lg font-semibold">FashionFit Studio</div>
              </div>
            </div>
          </div>

          <nav className="ff-card space-y-1 p-3">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-ink shadow-sm'
                      : 'text-ink/70 hover:bg-white/80 hover:text-ink'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ff-card p-4">
            {client && (
              <div className="mb-4 space-y-1">
                <div className="truncate text-sm font-semibold">{client.name}</div>
                <div className="truncate text-xs text-ink/60">{client.email}</div>
                <div className="pt-1">
                  <PlanBadge plan={client.plan} />
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="ff-btn-secondary w-full justify-start">
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/60 bg-white/88 p-2 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-primary/15 text-primary-800' : 'text-ink/60'
                }`
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
