import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, ShoppingCart, Store, Gauge, Plus, ArrowRight, Users, Wallet, Circle, CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <p className="ff-kicker">Client Command Center</p>
          <h1 className="ff-page-title">Witaj, {client?.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/65">
            To tutaj śledzisz, ilu klientów kupiło po wirtualnej przymiarce i jak rośnie skuteczność Twoich produktów.
          </p>
        </div>
        <Link to="/shops" className="ff-btn-primary">
          <Plus size={16} /> Dodaj sklep
        </Link>
      </section>

      {client?.status === 'trial' && days !== null && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-ink/20 bg-white p-4">
          <span className="text-sm text-ink/70">
            Trial kończy się za {days} {days === 1 ? 'dzień' : 'dni'}.
          </span>
          <Link to="/billing" className="ff-btn-primary">Wybierz plan</Link>
        </Card>
      )}

      {!!billing?.sandbox?.enabled && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-ink/20 bg-white p-4">
          <span className="text-sm text-ink/70">
            Środowisko testowe: wykorzystano {billing.sandbox.usedPhotoTryons}/{billing.sandbox.photoTryonLimit} darmowych przymiarek foto.
            {billing.sandbox.exhausted ? ' Limit testowy został wyczerpany.' : ` Pozostało ${billing.sandbox.remainingPhotoTryons}.`}
          </span>
          {billing.sandbox.shopId ? (
            <Link to={`/install/${billing.sandbox.shopId}`} className="ff-btn-primary">
              Otwórz instalację sandbox
            </Link>
          ) : null}
        </Card>
      )}

      {!loading && onboarding && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="ff-section-title">Onboarding</h2>
              <p className="mt-1 text-sm text-ink/60">
                Ukończono {onboarding.completed_steps}/{onboarding.total_steps} kroków ({onboarding.completion_percent}%)
              </p>
            </div>
            <div className="h-2 w-40 rounded-full bg-black/10">
              <div className="h-full rounded-full bg-black transition-all" style={{ width: `${onboarding.completion_percent}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {onboardingItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2">
                {item.done ? <CheckCircle2 size={16} className="text-ink" /> : <Circle size={16} className="text-ink/35" />}
                <span className={item.done ? 'text-sm font-medium text-ink' : 'text-sm text-ink/65'}>{item.label}</span>
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
          <MetricCard label="Dodane do koszyka" value={totals.addToCarts} icon={<ShoppingCart size={18} />} trend={deltas.addToCarts} sparkline={series.addToCarts} />
          <MetricCard label="Zakupy po przymiarce" value={totals.purchases} icon={<Wallet size={18} />} trend={deltas.purchases} sparkline={series.purchases} />
          <MetricCard label="Kupujący klienci" value={totals.buyers} icon={<Users size={18} />} />
          <MetricCard label="Przychód z przymiarek" value={formatMoney(totals.revenue)} icon={<Wallet size={18} />} trend={deltas.revenue} sparkline={series.revenue} />
          <MetricCard label="Aktywne sklepy" value={activeShops} icon={<Store size={18} />} />
          <MetricCard
            label="Pozostałe try-ony"
            value={remaining === null ? '—' : remaining}
            hint={billing ? `z ${billing.usage.limit} / mies.` : undefined}
            icon={<Gauge size={18} />}
          />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb size={17} className="text-ink" />
              <h2 className="ff-section-title">Insights</h2>
            </div>
            <div className="space-y-2">
              {insights.map((insight) => (
                <div key={insight} className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink/75">
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={17} className="text-ink" />
              <h2 className="ff-section-title">Alerty</h2>
            </div>
            {alerts.length === 0 ? (
              <div className="rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm text-ink/60">
                Brak krytycznych alertów. Wyniki i limity wyglądają stabilnie.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert} className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {alert}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="ff-section-title">Twoje sklepy</h2>
          <Link to="/shops" className="text-sm font-medium text-ink/60 hover:text-ink">Zobacz wszystkie</Link>
        </div>

        {loading ? (
          <RowsSkeleton />
        ) : stats.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-ink/60">Nie masz jeszcze żadnego sklepu.</p>
            <Link to="/shops" className="ff-btn-primary mt-4 inline-flex">
              <Plus size={16} /> Dodaj pierwszy sklep
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden p-1">
            {stats.map(({ shop, completions, conversion }) => (
              <button
                key={shop.id}
                onClick={() => navigate(`/shops/${shop.id}`)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition hover:bg-black/[0.03]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{shop.name || shop.domain}</span>
                    <StatusBadge status={shop.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="truncate text-sm text-ink/55">{shop.domain}</div>
                </div>
                <div className="hidden text-right text-sm sm:block">
                  <div className="font-semibold text-ink">{completions} przymiarek</div>
                  <div className="text-ink/55">konwersja {formatPercent(conversion)}</div>
                </div>
                <ArrowRight size={18} className="text-ink/35" />
              </button>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
