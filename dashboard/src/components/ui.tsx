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
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="ff-kpi-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-ink/50">{label}</span>
        {icon && <span className="text-ink/60">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold leading-none tracking-tight text-ink">{value}</div>
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
