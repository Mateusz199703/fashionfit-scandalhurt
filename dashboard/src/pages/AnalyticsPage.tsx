import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, ShoppingCart, CircleGauge, Sparkles, Wallet, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card } from '../components/ui';
import { Skeleton } from '../components/Skeleton';
import { AnalyticsOverview } from '../types';
import { formatPercent } from '../utils';

type Range = '7d' | '30d' | '90d' | 'custom';
const PRESETS: Range[] = ['7d', '30d', '90d'];
const COLORS = ['#111111', '#6B6B6B'];

export function AnalyticsPage() {
  const { id = '' } = useParams();
  const [range, setRange] = useState<Range>('30d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // For custom ranges we pull the 90d window and filter client-side.
    const period = range === 'custom' ? '90d' : range;
    api
      .get<AnalyticsOverview>('/api/analytics/overview', { params: { shopId: id, period } })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, range]);

  const view = useMemo(() => {
    if (!data) return null;
    let daily = data.daily_chart_data;
    if (range === 'custom' && (custom.from || custom.to)) {
      daily = daily.filter((d) => (!custom.from || d.date >= custom.from) && (!custom.to || d.date <= custom.to));
    }
    if (range === 'custom') {
      const funnel = daily.reduce(
        (acc, d) => ({
          opens: acc.opens + d.widget_opens,
          starts: acc.starts + d.tryon_starts,
          completions: acc.completions + d.tryon_completions,
          carts: acc.carts + d.add_to_carts,
        }),
        { opens: 0, starts: 0, completions: 0, carts: 0 },
      );
      return {
        daily,
        funnel,
        conversion: funnel.completions ? funnel.carts / funnel.completions : 0,
        purchases: daily.reduce((acc, d) => acc + (d.purchases || 0), 0),
        revenue: daily.reduce((acc, d) => acc + (d.revenue || 0), 0),
        buyers: data.buyers_count || 0,
        purchaseRate: funnel.completions
          ? daily.reduce((acc, d) => acc + (d.purchases || 0), 0) / funnel.completions
          : 0,
      };
    }
    return {
      daily,
      funnel: { opens: data.widget_opens, starts: data.tryon_starts, completions: data.completions, carts: data.add_to_carts },
      conversion: data.conversion_rate,
      purchases: data.purchases,
      revenue: data.revenue,
      buyers: data.buyers_count,
      purchaseRate: data.purchase_rate,
    };
  }, [data, range, custom]);

  const pieData = data
    ? [
        { name: 'Photo AI', value: data.mode_split.photo },
        { name: 'Live AR', value: data.mode_split.live_ar },
      ]
    : [];

  const funnelSteps = view
    ? [
        { label: 'Otwarcia widgetu', value: view.funnel.opens },
        { label: 'Rozpoczęte przymiarki', value: view.funnel.starts },
        { label: 'Ukończone', value: view.funnel.completions },
        { label: 'Dodano do koszyka', value: view.funnel.carts },
      ]
    : [];
  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));
  const kpi = view
    ? [
        { label: 'Przymiarki', value: view.funnel.completions, icon: Activity },
        { label: 'Do koszyka', value: view.funnel.carts, icon: ShoppingCart },
        { label: 'Zakupy', value: view.purchases, icon: Wallet },
        { label: 'Kupujący', value: view.buyers, icon: Users },
        { label: 'Konwersja', value: formatPercent(view.conversion), icon: CircleGauge },
        { label: 'Purchase rate', value: formatPercent(view.purchaseRate), icon: CircleGauge },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="ff-card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <Link to={`/shops/${id}`} className="mb-1 inline-flex items-center gap-1 text-sm text-ink/55 hover:text-ink">
            <ArrowLeft size={15} /> Sklep
          </Link>
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">Analytics Intelligence</p>
          <h1 className="text-3xl font-bold">Analityka</h1>
          <p className="mt-1 text-sm text-ink/60">Trendy przymiarek, konwersji i zachowań klientów w czasie.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setRange(p)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                range === p ? 'bg-gradient-to-r from-primary to-primary-700 text-white shadow' : 'border border-ink/15 bg-white/80 text-ink/70'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setRange('custom')}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              range === 'custom' ? 'bg-gradient-to-r from-primary to-primary-700 text-white shadow' : 'border border-ink/15 bg-white/80 text-ink/70'
            }`}
          >
            Zakres
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <input type="date" className="ff-input w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          <span className="text-ink/45">—</span>
          <input type="date" className="ff-input w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          <span className="text-xs text-ink/45">(z ostatnich 90 dni)</span>
        </Card>
      )}

      {loading || !view ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {kpi.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink/65">{label}</span>
                  <span className="rounded-xl bg-primary/10 p-2 text-primary-800"><Icon size={16} /></span>
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Przychód z klientów po przymiarce</h2>
              <span className="text-xs text-ink/60">atrybucja event `purchase`</span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">{new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(view.revenue || 0)}</div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Przymiarki i konwersje w czasie</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary-800">
                <Sparkles size={13} /> Live trend
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={view.daily} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666666' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#666666' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(16,33,45,0.12)', background: 'rgba(255,255,255,0.94)' }}
                    labelStyle={{ color: '#111111', fontWeight: 600 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="tryon_completions" name="Przymiarki" stroke="#111111" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="add_to_carts" name="Koszyk" stroke="#6B6B6B" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="purchases" name="Zakupy" stroke="#2f2f2f" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-4 font-semibold">Photo AI vs Live AR</h2>
              {pieData.every((d) => d.value === 0) ? (
                <p className="py-12 text-center text-sm text-ink/45">Brak danych przymiarek.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 font-semibold">Lejek konwersji</h2>
              <div className="space-y-3">
                {funnelSteps.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink/70">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${(s.value / funnelMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-sm text-ink/60">Współczynnik konwersji: {formatPercent(view.conversion)}</p>
                <p className="pt-1 text-sm text-ink/60">Współczynnik zakupu: {formatPercent(view.purchaseRate)}</p>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Top 10 produktów</h2>
            {data && data.top_products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="text-left text-xs uppercase text-ink/55">
                    <tr>
                      <th className="py-2">Produkt</th>
                      <th className="py-2">Przymiarki</th>
                      <th className="py-2">Konwersja</th>
                      <th className="py-2">Zakupy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {data.top_products.map((p) => (
                      <tr key={p.product_id} className="hover:bg-white/65">
                        <td className="py-2 font-medium">{p.name || p.product_id}</td>
                        <td className="py-2">{p.tryon_completions}</td>
                        <td className="py-2">
                          {p.tryon_completions ? formatPercent(p.add_to_carts / p.tryon_completions) : '—'}
                        </td>
                        <td className="py-2">{p.purchases || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink/45">Brak danych.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
