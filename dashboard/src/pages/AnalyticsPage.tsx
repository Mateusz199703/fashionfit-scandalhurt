import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, ShoppingCart, CircleGauge, Sparkles, Wallet, Users, Layers3 } from 'lucide-react';
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
type CategoryFilter = 'all' | 'tops' | 'bottoms' | 'one-pieces' | 'outerwear' | 'accessories';
const PRESETS: Range[] = ['7d', '30d', '90d'];
const COLORS = ['#111111', '#7B7B7B'];
const CATEGORY_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'Wszystkie kategorie' },
  { value: 'tops', label: 'Góra (tops)' },
  { value: 'bottoms', label: 'Dół (bottoms)' },
  { value: 'one-pieces', label: 'One-pieces' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessories', label: 'Akcesoria' },
];
const CATEGORY_LABEL: Record<CategoryFilter, string> = {
  all: 'Wszystkie',
  tops: 'Tops',
  bottoms: 'Bottoms',
  'one-pieces': 'One-pieces',
  outerwear: 'Outerwear',
  accessories: 'Akcesoria',
};

export function AnalyticsPage() {
  const { id = '' } = useParams();
  const [range, setRange] = useState<Range>('30d');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const period = range === 'custom' ? '90d' : range;
    api
      .get<AnalyticsOverview>('/api/analytics/overview', { params: { shopId: id, period, category } })
      .then((r) => setData(r.data))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, range, category]);

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
        tryonCompletionRate: funnel.starts ? funnel.completions / funnel.starts : 0,
        cartToPurchaseRate: funnel.carts
          ? daily.reduce((acc, d) => acc + (d.purchases || 0), 0) / funnel.carts
          : 0,
        avgOrderValue: daily.reduce((acc, d) => acc + (d.purchases || 0), 0) > 0
          ? daily.reduce((acc, d) => acc + (d.revenue || 0), 0) / daily.reduce((acc, d) => acc + (d.purchases || 0), 0)
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
      tryonCompletionRate: data.tryon_completion_rate || 0,
      cartToPurchaseRate: data.cart_to_purchase_rate || 0,
      avgOrderValue: data.average_order_value || 0,
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
        { label: 'Ukończone przymiarki', value: view.funnel.completions },
        { label: 'Dodane do koszyka', value: view.funnel.carts },
      ]
    : [];

  const funnelMax = Math.max(1, ...funnelSteps.map((s) => s.value));
  const kpi = view
    ? [
        { label: 'Przymiarki', value: view.funnel.completions, icon: Activity },
        { label: 'Koszyk', value: view.funnel.carts, icon: ShoppingCart },
        { label: 'Zakupy', value: view.purchases, icon: Wallet },
        { label: 'Kupujący', value: view.buyers, icon: Users },
        { label: 'Konwersja', value: formatPercent(view.conversion), icon: CircleGauge },
        { label: 'Purchase rate', value: formatPercent(view.purchaseRate), icon: CircleGauge },
        { label: 'Try-on completion', value: formatPercent(view.tryonCompletionRate), icon: CircleGauge },
        { label: 'Cart -> Purchase', value: formatPercent(view.cartToPurchaseRate), icon: CircleGauge },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <Link to={`/shops/${id}`} className="mb-2 inline-flex items-center gap-1 text-sm text-ink/55 hover:text-ink">
            <ArrowLeft size={15} /> Sklep
          </Link>
          <p className="ff-kicker">Analytics</p>
          <h1 className="ff-page-title">Analityka konwersji</h1>
          <p className="mt-2 text-sm text-ink/65">Pełny obraz: od wejścia do widgetu aż po zakup po przymiarce.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setRange(p)}
              className={range === p ? 'ff-range ff-range-active' : 'ff-range ff-range-idle'}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setRange('custom')}
            className={range === 'custom' ? 'ff-range ff-range-active' : 'ff-range ff-range-idle'}
          >
            Zakres
          </button>
          <select
            className="ff-input w-auto min-w-[220px]"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {range === 'custom' && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <input type="date" className="ff-input w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          <span className="text-ink/45">—</span>
          <input type="date" className="ff-input w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          <span className="text-xs text-ink/45">(zakres z ostatnich 90 dni)</span>
        </Card>
      )}

      {loading || !view ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {kpi.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="ff-kpi-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.1em] text-ink/50">{label}</span>
                  <span className="rounded-full border border-ink/15 bg-white p-2 text-ink"><Icon size={16} /></span>
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-ink">{value}</div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="ff-section-title">Przychód z klientów po przymiarce</h2>
              <span className="text-xs text-ink/60">event `purchase`</span>
            </div>
            <div className="mt-3 text-4xl font-bold tracking-tight text-ink">
              {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(view.revenue || 0)}
            </div>
            <p className="mt-2 text-sm text-ink/60">
              Średnia wartość zamówienia (AOV): {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(view.avgOrderValue || 0)}
            </p>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="ff-section-title">Trend: przymiarki, koszyk, zakupy</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-medium text-ink/70">
                <Sparkles size={13} /> Live trend
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={view.daily} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#585858' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#585858' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(17,17,17,0.12)', background: 'rgba(255,255,255,0.97)' }}
                    labelStyle={{ color: '#111111', fontWeight: 600 }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="tryon_completions" name="Przymiarki" stroke="#111111" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="add_to_carts" name="Koszyk" stroke="#6e6e6e" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="purchases" name="Zakupy" stroke="#2a2a2a" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="ff-section-title mb-4">Photo AI vs Live AR</h2>
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
              <h2 className="ff-section-title mb-4">Lejek konwersji</h2>
              <div className="space-y-3">
                {funnelSteps.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink/70">{s.label}</span>
                      <span className="font-semibold text-ink">{s.value}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-black" style={{ width: `${(s.value / funnelMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-sm text-ink/60">Współczynnik konwersji: {formatPercent(view.conversion)}</p>
                <p className="pt-1 text-sm text-ink/60">Współczynnik zakupu: {formatPercent(view.purchaseRate)}</p>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="ff-section-title">Wynik wg kategorii ubrań</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-medium text-ink/70">
                <Layers3 size={13} /> {CATEGORY_LABEL[category]}
              </span>
            </div>
            {data?.category_breakdown && data.category_breakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="ff-table min-w-[620px]">
                  <thead>
                    <tr>
                      <th>Kategoria</th>
                      <th>Przymiarki</th>
                      <th>Do koszyka</th>
                      <th>Zakupy</th>
                      <th>Konwersja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.category_breakdown.map((row) => (
                      <tr key={row.category}>
                        <td className="font-semibold text-ink">{CATEGORY_LABEL[row.category as CategoryFilter] || row.category}</td>
                        <td>{row.tryon_completions}</td>
                        <td>{row.add_to_carts}</td>
                        <td>{row.purchases}</td>
                        <td>{formatPercent(row.conversion_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink/45">Brak danych kategorii.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="ff-section-title mb-4">Top 10 produktów</h2>
            {data && data.top_products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="ff-table min-w-[620px]">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Kategoria</th>
                      <th>Przymiarki</th>
                      <th>Konwersja</th>
                      <th>Zakupy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_products.map((p) => (
                      <tr key={p.product_id}>
                        <td className="font-semibold text-ink">{p.name || p.product_id}</td>
                        <td>{p.category || '—'}</td>
                        <td>{p.tryon_completions}</td>
                        <td>{p.tryon_completions ? formatPercent(p.add_to_carts / p.tryon_completions) : '—'}</td>
                        <td>{p.purchases || 0}</td>
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
