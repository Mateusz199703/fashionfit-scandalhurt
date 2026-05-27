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
      <div className="ff-card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">Billing Center</p>
          <h1 className="text-3xl font-bold">Płatności</h1>
          <p className="mt-1 text-sm text-ink/60">Kontroluj plan, limity i historię rozliczeń z jednego miejsca.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-800">
          <CreditCard size={14} /> Subskrypcja
        </span>
      </div>

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
                  ? `Okres: ${formatDate(overview.periodStart)} – ${formatDate(overview.periodEnd)}`
                  : overview.status === 'trial'
                  ? `Okres próbny do ${formatDate(overview.trialEndsAt)}`
                  : 'Brak aktywnej subskrypcji'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-ink/70">Wykorzystanie przymiarek (ten miesiąc)</span>
              <span className="font-medium">
                {overview.usage.used} / {overview.usage.limit}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full ${usagePct >= 90 ? 'bg-secondary' : 'bg-primary'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Plany</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = overview?.plan === plan.id;
            return (
              <Card key={plan.id} className={`flex flex-col p-5 transition-transform duration-200 hover:-translate-y-0.5 ${isCurrent ? 'ring-2 ring-primary/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {isCurrent && <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Sparkles size={13} /> Aktualny</span>}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price} zł</span>
                  <span className="text-sm text-ink/60"> / mies.</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink/70">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={15} className="text-secondary" /> {f}
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
        <h2 className="mb-3 text-lg font-semibold">Historia płatności</h2>
        {loading ? (
          <RowsSkeleton rows={3} />
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink/60">Brak płatności.</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-white/70 text-left text-xs uppercase text-ink/55">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Kwota</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/65">
                      <td className="px-4 py-3">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 font-medium">{formatMoney(p.amount, p.currency)}</td>
                      <td className="px-4 py-3 text-ink/65">{p.status}</td>
                      <td className="px-4 py-3 text-right">
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-primary-800 hover:underline">
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
