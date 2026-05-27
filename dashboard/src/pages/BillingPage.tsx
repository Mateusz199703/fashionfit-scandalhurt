import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card, PlanBadge } from '../components/ui';
import { Skeleton, RowsSkeleton } from '../components/Skeleton';
import { PLANS } from '../config';
import { BillingOverview, Payment, Plan } from '../types';
import { formatDate, formatMoney } from '../utils';

export function BillingPage() {
  const [params, setParams] = useSearchParams();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<Plan | null>(null);

  useEffect(() => {
    const status = params.get('status');
    if (status === 'success') toast.success('Subskrypcja aktywowana!');
    if (status === 'cancel') toast('Płatność anulowana', { icon: 'ℹ️' });
    if (status) {
      params.delete('status');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<BillingOverview>('/api/billing/overview').then((r) => r.data),
      api.get<{ payments: Payment[] }>('/api/billing/history').then((r) => r.data.payments).catch(() => []),
    ])
      .then(([ov, pay]) => {
        setOverview(ov);
        setPayments(pay);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const upgrade = async (plan: Plan) => {
    setUpgrading(plan);
    try {
      const { data } = await api.post<{ url: string }>('/api/billing/checkout', { plan });
      window.location.href = data.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Nie udało się rozpocząć płatności'));
      setUpgrading(null);
    }
  };

  const usagePct = overview && overview.usage.limit > 0
    ? Math.min(100, Math.round((overview.usage.used / overview.usage.limit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <p className="ff-kicker">Billing Center</p>
          <h1 className="ff-page-title">Płatności</h1>
          <p className="mt-2 text-sm text-ink/65">Plan, limity i historia rozliczeń w jednym miejscu.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-ink/70">
          <CreditCard size={14} /> Subskrypcja
        </span>
      </section>

      {loading || !overview ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink/60">Aktualny plan</span>
                <PlanBadge plan={overview.plan} />
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {overview.periodStart && overview.periodEnd
                  ? `Okres: ${formatDate(overview.periodStart)} - ${formatDate(overview.periodEnd)}`
                  : overview.status === 'trial'
                  ? `Okres próbny do ${formatDate(overview.trialEndsAt)}`
                  : 'Brak aktywnej subskrypcji'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-ink/70">Wykorzystanie przymiarek (ten miesiąc)</span>
              <span className="font-semibold text-ink">
                {overview.usage.used} / {overview.usage.limit}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-black/10">
              <div className="h-full rounded-full bg-black" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="ff-section-title mb-3">Plany</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = overview?.plan === plan.id;
            return (
              <Card key={plan.id} className={`flex flex-col p-5 ${isCurrent ? 'ring-1 ring-black/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-3xl leading-none text-ink">{plan.name}</h3>
                  {isCurrent && <span className="inline-flex items-center gap-1 text-xs font-medium text-ink"><Sparkles size={13} /> Aktualny</span>}
                </div>
                <div className="mt-3">
                  <span className="text-4xl font-bold leading-none text-ink">{plan.price} zł</span>
                  <span className="text-sm text-ink/60"> / mies.</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink/70">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={15} className="text-ink" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className="ff-btn-primary mt-5"
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => upgrade(plan.id)}
                >
                  {isCurrent ? 'Aktywny' : upgrading === plan.id ? 'Przekierowanie...' : 'Wybierz plan'}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="ff-section-title mb-3">Historia płatności</h2>
        {loading ? (
          <RowsSkeleton rows={3} />
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink/60">Brak płatności.</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ff-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Kwota</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDate(p.date)}</td>
                      <td className="font-semibold text-ink">{formatMoney(p.amount, p.currency)}</td>
                      <td className="text-ink/65">{p.status}</td>
                      <td className="text-right">
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-ink hover:underline">
                            Faktura
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
