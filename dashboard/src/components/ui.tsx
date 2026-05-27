import React from 'react';
import { Plan, ClientStatus } from '../types';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`ff-card ${className}`}>{children}</div>;
}

const PLAN_STYLES: Record<Plan, string> = {
  STARTER: 'bg-white text-ink border border-ink/15',
  GROWTH: 'bg-primary-50 text-primary-800 border border-primary/20',
  SCALE: 'bg-secondary-50 text-secondary-700 border border-secondary/20',
};

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${PLAN_STYLES[plan]}`}>
      {plan}
    </span>
  );
}

const STATUS_STYLES: Record<ClientStatus | string, string> = {
  trial: 'bg-secondary-50 text-secondary-700',
  active: 'bg-primary-50 text-primary-800',
  inactive: 'bg-white text-ink/60 border border-ink/15',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink/65">{label}</span>
        {icon && <span className="text-primary-700">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink/50">{hint}</div>}
    </Card>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink/65">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}
