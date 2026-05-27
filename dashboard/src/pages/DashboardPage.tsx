import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, ShoppingCart, Store, Gauge, Plus, ArrowRight, Users, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { MetricCard, Card, StatusBadge } from '../components/ui';
import { MetricGridSkeleton, RowsSkeleton } from '../components/Skeleton';
import { AnalyticsOverview, BillingOverview, Shop } from '../types';
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
  const [billing, setBilling] = useState<BillingOverview | null>(null);

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
        const shopStats = shops.map((shop, i) => {
          const a = analytics[i];
          completions += a?.completions || 0;
          addToCarts += a?.add_to_carts || 0;
          purchases += a?.purchases || 0;
          buyers += a?.buyers_count || 0;
          revenue += a?.revenue || 0;
          return { shop, completions: a?.completions || 0, conversion: a?.conversion_rate || 0 };
        });

        setStats(shopStats);
        setTotals({ completions, addToCarts, purchases, buyers, revenue });
        setBilling(billingRes ? billingRes.data : null);
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

  return (
    <div className="space-y-6">
      <div className="ff-card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink/45">Overview</p>
          <h1 className="text-3xl font-bold leading-tight">Witaj, {client?.name}</h1>
        </div>
        <Link to="/shops" className="ff-btn-primary">
          <Plus size={16} /> Dodaj sklep
        </Link>
      </div>

      {client?.status === 'trial' && days !== null && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-secondary/30 bg-secondary-50 p-4">
          <span className="text-sm text-secondary-700">
            {days} {days === 1 ? 'dzień' : 'dni'} do końca okresu próbnego.
          </span>
          <Link to="/billing" className="ff-btn-primary">Wybierz plan</Link>
        </Card>
      )}

      {loading ? (
        <MetricGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Przymiarki (30 dni)" value={totals.completions} icon={<Shirt size={18} />} />
          <MetricCard label="Dodane do koszyka" value={totals.addToCarts} icon={<ShoppingCart size={18} />} />
          <MetricCard label="Zakupy po przymiarce" value={totals.purchases} icon={<Wallet size={18} />} />
          <MetricCard label="Kupujący klienci" value={totals.buyers} icon={<Users size={18} />} />
          <MetricCard label="Przychód z przymiarek" value={formatMoney(totals.revenue)} icon={<Wallet size={18} />} />
          <MetricCard label="Sklepy aktywne" value={activeShops} icon={<Store size={18} />} />
          <MetricCard label="Pozostałe try-ony" value={remaining === null ? '—' : remaining} hint={billing ? `z ${billing.usage.limit} / mies.` : undefined} icon={<Gauge size={18} />} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Twoje sklepy</h2>
        {loading ? (
          <RowsSkeleton />
        ) : stats.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500">Nie masz jeszcze żadnego sklepu.</p>
            <Link to="/shops" className="ff-btn-primary mt-4 inline-flex">
              <Plus size={16} /> Dodaj pierwszy sklep
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100">
            {stats.map(({ shop, completions, conversion }) => (
              <button
                key={shop.id}
                onClick={() => navigate(`/shops/${shop.id}`)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-white/80"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{shop.name || shop.domain}</span>
                    <StatusBadge status={shop.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="truncate text-sm text-ink/60">{shop.domain}</div>
                </div>
                <div className="hidden text-right text-sm text-ink/80 sm:block">
                  <div className="font-medium">{completions} przymiarek</div>
                  <div className="text-ink/55">konwersja {formatPercent(conversion)}</div>
                </div>
                <ArrowRight size={18} className="text-ink/40" />
              </button>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
