import React from 'react';
import { Plan, ClientStatus } from '../types';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ff-surface ${className}`}>{children}</div>;
}

const PLAN_STYLES: Record<Plan, string> = {
  STARTER: 'bg-white text-ink border border-ink/20',
  GROWTH: 'bg-ink text-white border border-ink',
  SCALE: 'bg-gradient-to-r from-ink to-black text-white border border-black',
};

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase ${PLAN_STYLES[plan]}`}>
      {plan}
    </span>
  );
}

const STATUS_STYLES: Record<ClientStatus | string, string> = {
  trial: 'bg-white text-ink border border-ink/20',
  active: 'bg-ink text-white border border-ink',
  inactive: 'bg-secondary-100 text-ink/70 border border-ink/10',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.07em] uppercase ${STATUS_STYLES[status] || 'bg-secondary-100 text-ink/70 border border-ink/10'}`}>
      {status}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  trend,
  sparkline,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  trend?: number | null;
  sparkline?: number[];
}) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend);
  const trendUp = (trend || 0) >= 0;
  const points = (sparkline || []).filter((x) => Number.isFinite(x));
  const max = Math.max(1, ...points);
  const min = Math.min(...points, 0);
  const range = Math.max(1, max - min);
  const path = points
    .map((point, i) => {
      const x = points.length === 1 ? 0 : (i / (points.length - 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card className="ff-kpi-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-ink/50">{label}</span>
        {icon && <span className="text-ink/60">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none tracking-tight text-ink">{value}</div>
      {points.length > 1 && (
        <div className="mt-3 h-10">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              points={path}
              fill="none"
              stroke={trendUp ? '#111111' : '#8a8a8a'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {hasTrend && (
        <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {trendUp ? '+' : ''}
          {trend!.toFixed(1)}% vs 7 dni wcześniej
        </div>
      )}
      {hint && <div className="mt-2 text-xs text-ink/55">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <h3 className="font-display text-3xl text-ink">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-xl text-sm text-ink/65">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}
