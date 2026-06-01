import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, ShoppingCart, Gauge, ArrowRight, Wallet, Circle, CheckCircle2, Lightbulb, AlertTriangle, Bell, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MetricCard, Card, StatusBadge } from '../components/ui';
import { MetricGridSkeleton, RowsSkeleton } from '../components/Skeleton';
import { AnalyticsOverview, BillingOverview, OnboardingProgress, Shop } from '../types';
import { formatMoney, formatPercent, trialDaysLeft } from '../utils';

interface ShopStat {
  shop: Shop;
  completions: number;
  conversion: number;
}

export function DashboardPage() {
  const { client } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ShopStat[]>([]);
  const [totals, setTotals] = useState({ completions: 0, addToCarts: 0, purchases: 0, buyers: 0, revenue: 0 });
  const [series, setSeries] = useState({ completions: [] as number[], addToCarts: [] as number[], purchases: [] as number[], revenue: [] as number[] });
  const [deltas, setDeltas] = useState({ completions: null as number | null, addToCarts: null as number | null, purchases: null as number | null, revenue: null as number | null });
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: shopsData }, billingRes] = await Promise.all([
          api.get<{ shops: Shop[] }>('/api/shops'),
          api.get<BillingOverview>('/api/billing/overview').catch(() => null),
        ]);
        const shops = shopsData.shops;

        const analytics = await Promise.all(
          shops.map((shop) =>
            api
              .get<AnalyticsOverview>('/api/analytics/overview', { params: { shopId: shop.id, period: '30d' } })
              .then((r) => r.data)
              .catch(() => null),
          ),
        );

        if (cancelled) return;

        let completions = 0;
        let addToCarts = 0;
        let purchases = 0;
        let buyers = 0;
        let revenue = 0;
        const daily = new Map<string, { completions: number; carts: number; purchases: number; revenue: number }>();
        const shopStats = shops.map((shop, i) => {
          const a = analytics[i];
          completions += a?.completions || 0;
          addToCarts += a?.add_to_carts || 0;
          purchases += a?.purchases || 0;
          buyers += a?.buyers_count || 0;
          revenue += a?.revenue || 0;
          (a?.daily_chart_data || []).forEach((day) => {
            const prev = daily.get(day.date) || { completions: 0, carts: 0, purchases: 0, revenue: 0 };
            daily.set(day.date, {
              completions: prev.completions + (day.tryon_completions || 0),
              carts: prev.carts + (day.add_to_carts || 0),
              purchases: prev.purchases + (day.purchases || 0),
              revenue: prev.revenue + (day.revenue || 0),
            });
          });
          return { shop, completions: a?.completions || 0, conversion: a?.conversion_rate || 0 };
        });

        const days = Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const completionSeries = days.map(([, d]) => d.completions);
        const cartSeries = days.map(([, d]) => d.carts);
        const purchaseSeries = days.map(([, d]) => d.purchases);
        const revenueSeries = days.map(([, d]) => d.revenue);

        const splitDelta = (values: number[]) => {
          if (values.length < 14) return null;
          const recent = values.slice(-7).reduce((acc, x) => acc + x, 0);
          const previous = values.slice(-14, -7).reduce((acc, x) => acc + x, 0);
          if (previous <= 0) return recent > 0 ? 100 : 0;
          return ((recent - previous) / previous) * 100;
        };

        setStats(shopStats);
        setTotals({ completions, addToCarts, purchases, buyers, revenue });
        setSeries({
          completions: completionSeries,
          addToCarts: cartSeries,
          purchases: purchaseSeries,
          revenue: revenueSeries,
        });
        setDeltas({
          completions: splitDelta(completionSeries),
          addToCarts: splitDelta(cartSeries),
          purchases: splitDelta(purchaseSeries),
          revenue: splitDelta(revenueSeries),
        });
        setBilling(billingRes ? billingRes.data : null);

        const onboardingRes = await api.get<OnboardingProgress>('/api/onboarding/progress').catch(() => null);
        if (onboardingRes && !cancelled) setOnboarding(onboardingRes.data);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeShops = stats.filter((s) => s.shop.is_active).length;
  const remaining = billing ? Math.max(0, billing.usage.limit - billing.usage.used) : null;
  const days = trialDaysLeft(client?.trialEndsAt);
  const conversion = totals.completions ? totals.addToCarts / totals.completions : 0;
  const lookConversion = totals.addToCarts ? totals.purchases / totals.addToCarts : 0;
  const today = new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' });

  const insights = [
    conversion >= 0.12
      ? `Świetny wynik: konwersja po przymiarce wynosi ${formatPercent(conversion)}.`
      : `Konwersja po przymiarce to ${formatPercent(conversion)}. Warto przetestować lepsze zdjęcia produktów.`,
    totals.purchases > 0
      ? `Klienci po przymiarce zrealizowali ${totals.purchases} zakupów.`
      : 'Brak zakupów po przymiarce w ostatnich 30 dniach. Włącz prompt „Dodaj do koszyka” po wyniku.',
    activeShops > 1
      ? `Masz ${activeShops} aktywne sklepy. Rozważ segmentację wyników per sklep.`
      : 'Dodaj drugi sklep testowy, aby porównać skuteczność między katalogami.',
  ];

  const alerts = [
    remaining !== null && remaining <= 15 ? `Niski limit: zostało ${remaining} przymiarek w tym miesiącu.` : null,
    client?.status === 'trial' && days !== null && days <= 3 ? `Trial kończy się za ${days} dni.` : null,
    totals.completions > 0 && conversion < 0.05 ? 'Niska konwersja po przymiarce (<5%). Sprawdź CTA i opis rozmiarów.' : null,
  ].filter(Boolean) as string[];

  const onboardingItems = onboarding
    ? [
        { label: 'Konto utworzone', done: onboarding.step_account_created },
        { label: 'Sklep dodany', done: onboarding.step_shop_added },
        { label: 'Wtyczka połączona', done: onboarding.step_plugin_installed },
        { label: 'Produkty zsynchronizowane', done: onboarding.step_products_synced },
        { label: 'Pierwsza przymiarka klienta', done: onboarding.step_first_tryon },
        { label: 'Plan aktywny (płatność)', done: onboarding.step_subscription_active },
      ]
    : [];

  const chartSeriesA = series.completions.slice(-14);
  const chartSeriesB = series.purchases.slice(-14);
  const toPolyline = (values: number[]) => {
    if (values.length < 2) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 100;
        const y = 92 - (((value - min) / range) * 78);
        return `${x},${y}`;
      })
      .join(' ');
  };
  const polylineA = toPolyline(chartSeriesA);
  const polylineB = toPolyline(chartSeriesB);

  const integrationRows = [
    {
      name: 'WooCommerce',
      description: onboarding?.step_plugin_installed ? 'Synchronizacja katalogu aktywna' : 'Wymaga połączenia wtyczki',
      status: onboarding?.step_plugin_installed ? 'Aktywna' : 'W trakcie',
      tone: onboarding?.step_plugin_installed ? 'ok' : 'soon',
    },
    { name: 'Custom API', description: 'Kanał rozszerzony', status: 'Wkrótce', tone: 'soon' },
    { name: 'Shopify', description: 'Integracja roadmap', status: 'Wkrótce', tone: 'soon' },
    { name: 'PrestaShop', description: 'Integracja roadmap', status: 'Wkrótce', tone: 'soon' },
  ] as const;

  return (
    <div className="space-y-5">
      <section className="ff-dash-head">
        <div>
          <h1 className="ff-dash-title">Pulpit</h1>
          <p className="ff-dash-sub">Dzisiaj: {today} · Ostatnia synchronizacja: {loading ? 'trwa' : 'aktualna'}</p>
        </div>
        <div className="ff-dash-controls">
          <div className="ff-dash-search" aria-hidden="true">
            <Search size={14} />
            <span>Szukaj sklepu lub metryki</span>
          </div>
          <div className="ff-dash-range" aria-hidden="true">
            <span>7 dni</span>
            <span className="is-active">30 dni</span>
            <span>90 dni</span>
          </div>
          <span className="ff-dash-bell" aria-hidden="true">
            <Bell size={15} />
          </span>
        </div>
      </section>

      {client?.status === 'trial' && days !== null && (
        <Card className="ff-dash-trial">
          <span>Trial kończy się za {days} {days === 1 ? 'dzień' : 'dni'}.</span>
          <Link to="/billing" className="ff-btn-primary">Wybierz plan</Link>
        </Card>
      )}

      {!!billing?.sandbox?.enabled && (
        <Card className="ff-dash-trial">
          <span>
            Środowisko testowe: wykorzystano {billing.sandbox.usedPhotoTryons}/{billing.sandbox.photoTryonLimit} darmowych przymiarek foto.
            {billing.sandbox.exhausted ? ' Limit testowy został wyczerpany.' : ` Pozostało ${billing.sandbox.remainingPhotoTryons}.`}
          </span>
          {billing.sandbox.shopId ? (
            <Link to={`/install/${billing.sandbox.shopId}`} className="ff-btn-primary">Otwórz instalację sandbox</Link>
          ) : null}
        </Card>
      )}

      {!loading && onboarding && (
        <Card className="ff-dash-onboarding">
          <div className="ff-dash-onboarding-head">
            <div>
              <h2 className="ff-section-title">Onboarding</h2>
              <p>Ukończono {onboarding.completed_steps}/{onboarding.total_steps} kroków ({onboarding.completion_percent}%)</p>
            </div>
            <div className="ff-dash-progress">
              <i style={{ width: `${onboarding.completion_percent}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {onboardingItems.map((item) => (
              <div key={item.label} className="ff-dash-onboarding-item">
                {item.done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-zinc-300" />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <MetricGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Przymiarki 30 dni" value={totals.completions} icon={<Shirt size={18} />} trend={deltas.completions} sparkline={series.completions} />
          <MetricCard label="Konwersja po przymiarce" value={formatPercent(conversion)} icon={<ShoppingCart size={18} />} trend={deltas.addToCarts} sparkline={series.addToCarts} />
          <MetricCard label="Zakupy po przymiarce" value={totals.purchases} icon={<Wallet size={18} />} trend={deltas.purchases} sparkline={series.purchases} />
          <MetricCard label="Przychód z przymiarek" value={formatMoney(totals.revenue)} icon={<Gauge size={18} />} trend={deltas.revenue} sparkline={series.revenue} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card className="ff-dash-card p-5">
          <div className="ff-dash-card-head">
            <h2 className="ff-section-title">Konwersja vs aktywność zakupowa</h2>
            <span>Ostatnie 14 dni</span>
          </div>
          {loading || !polylineA || !polylineB ? (
            <RowsSkeleton rows={1} />
          ) : (
            <svg viewBox="0 0 100 100" className="h-56 w-full">
              <defs>
                <linearGradient id="ffDashLineA" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#7B61FF" />
                  <stop offset="55%" stopColor="#8B5CFF" />
                  <stop offset="100%" stopColor="#FFB15C" />
                </linearGradient>
              </defs>
              {[18, 38, 58, 78].map((line) => (
                <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="rgba(20,20,28,0.08)" strokeWidth="0.6" />
              ))}
              <polyline points={polylineA} fill="none" stroke="url(#ffDashLineA)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={polylineB} fill="none" stroke="#FB7185" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" opacity="0.85" />
            </svg>
          )}
        </Card>

        <Card className="ff-dash-card p-5">
          <div className="ff-dash-card-head">
            <h2 className="ff-section-title">Looki → zakup</h2>
            <span>Udział finalizacji</span>
          </div>
          <div className="ff-dash-donut-wrap">
            <div
              className="ff-dash-donut"
              style={{ background: `conic-gradient(#7b61ff 0 ${Math.round(lookConversion * 100)}%, rgba(20,20,28,0.1) ${Math.round(lookConversion * 100)}% 100%)` }}
            >
              <div className="ff-dash-donut-inner">
                <b>{Math.round(lookConversion * 100)}%</b>
                <span>konwersja looków</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-ink/70">
              <div className="ff-dash-legend-row"><i style={{ background: '#7b61ff' }} />Kupiony look <b>{Math.round(lookConversion * 100)}%</b></div>
              <div className="ff-dash-legend-row"><i style={{ background: '#ffb15c' }} />W koszyku <b>{formatPercent(conversion)}</b></div>
              <div className="ff-dash-legend-row"><i style={{ background: 'rgba(20,20,28,0.24)' }} />Bez zakupu <b>{Math.max(0, 100 - Math.round(lookConversion * 100))}%</b></div>
            </div>
          </div>
        </Card>
      </div>

      {!loading && (
        <Card className="ff-dash-insight">
          <div className="ff-dash-insight-icon"><Lightbulb size={20} /></div>
          <div className="min-w-0">
            <p className="ff-dash-insight-tag">INSIGHT AI · wykryty wzorzec</p>
            <p className="ff-dash-insight-copy">{insights[0]}</p>
          </div>
          <button type="button" className="ff-btn-primary" disabled>
            Włącz auto-look (wkrótce)
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="ff-dash-card p-4">
          <div className="ff-dash-card-head px-1 pb-2">
            <h2 className="ff-section-title">Ostatnia aktywność</h2>
            <span>{loading ? 'Ładowanie...' : `${stats.length} sklepów`}</span>
          </div>
          {loading ? (
            <RowsSkeleton />
          ) : stats.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white px-4 py-8 text-center text-sm text-ink/60">
              Brak danych aktywności. Dodaj pierwszy sklep, aby rozpocząć analizę.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <table className="ff-table">
                <thead>
                  <tr>
                    <th>Sklep</th>
                    <th>Status</th>
                    <th>Przymiarki</th>
                    <th>Konwersja</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {stats.slice(0, 6).map(({ shop, completions, conversion: shopConversion }) => (
                    <tr key={shop.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="ff-dash-avatar">{(shop.name || shop.domain).slice(0, 2).toUpperCase()}</span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink">{shop.name || shop.domain}</div>
                            <div className="truncate text-xs text-ink/55">{shop.domain}</div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={shop.is_active ? 'active' : 'inactive'} /></td>
                      <td className="font-num text-sm font-semibold text-ink">{completions}</td>
                      <td className="text-sm text-ink/70">{formatPercent(shopConversion)}</td>
                      <td>
                        <button type="button" onClick={() => navigate(`/shops/${shop.id}`)} className="ff-dash-row-link">
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="ff-dash-card p-5">
          <div className="ff-dash-card-head mb-2">
            <h2 className="ff-section-title">Status integracji</h2>
            <span>Kanały sprzedaży</span>
          </div>
          <div className="space-y-2">
            {integrationRows.map((row) => (
              <div key={row.name} className="ff-dash-integration-row">
                <div>
                  <b>{row.name}</b>
                  <span>{row.description}</span>
                </div>
                <span className={row.tone === 'ok' ? 'ff-dash-pill ff-dash-pill-ok' : 'ff-dash-pill'}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/70">
              Aktywne sklepy: <b className="font-num text-ink">{activeShops}</b>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/70">
              Kupujący klienci: <b className="font-num text-ink">{totals.buyers}</b>
            </div>
            {remaining !== null && (
              <div className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/70">
                Pozostałe try-ony: <b className="font-num text-ink">{remaining}</b>
              </div>
            )}
          </div>
        </Card>
      </div>

      {!loading && alerts.length > 0 && (
        <Card className="ff-dash-alerts p-4">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h2 className="ff-section-title">Alerty</h2>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert} className="rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {alert}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
