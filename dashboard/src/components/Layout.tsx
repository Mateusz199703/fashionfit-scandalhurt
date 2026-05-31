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
    <div className="ff-app-shell min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06060b]/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-[#7b61ff] to-[#4f46e5] text-white shadow-[0_10px_30px_-16px_rgba(123,97,255,0.9)]">
              <Shirt size={18} />
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">FashionFit</div>
              <div className="text-sm font-semibold text-white">Client Studio</div>
            </div>
          </div>
          <button onClick={handleLogout} className="ff-btn-secondary border-white/20 bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/15">
            <LogOut size={14} /> Wyloguj
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <aside className="hidden w-[290px] shrink-0 flex-col rounded-[28px] border border-white/10 bg-[rgba(18,18,24,0.7)] p-5 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl md:flex">
          <div className="rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.04)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#7b61ff] to-[#4f46e5] text-white shadow-[0_14px_32px_-16px_rgba(123,97,255,0.95)]">
                <Shirt size={20} />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">Fashion SaaS</div>
                <div className="font-display text-2xl leading-none text-white">FashionFit</div>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {NAV.map(({ to, label, icon: Icon }) => (
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
          </nav>

          <div className="mt-auto rounded-2xl border border-white/15 bg-[rgba(255,255,255,0.04)] p-4">
            {client && (
              <div className="mb-4 space-y-1">
                <div className="truncate text-sm font-semibold text-white">{client.name}</div>
                <div className="truncate text-xs text-white/60">{client.email}</div>
                <div className="pt-1">
                  <PlanBadge plan={client.plan} />
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="ff-btn-secondary w-full justify-start border-white/20 bg-white/10 text-white hover:bg-white/15">
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="ff-main-wrap mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/15 bg-[rgba(10,10,14,0.9)] p-2 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4 gap-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                  isActive ? 'bg-gradient-to-r from-[#7b61ff] to-[#4f46e5] text-white shadow-[0_10px_28px_-16px_rgba(123,97,255,1)]' : 'text-white/72'
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
