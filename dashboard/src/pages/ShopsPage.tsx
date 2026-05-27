import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings as SettingsIcon, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card, StatusBadge, EmptyState } from '../components/ui';
import { Modal } from '../components/Modal';
import { RowsSkeleton } from '../components/Skeleton';
import { AnalyticsOverview, Shop, ShopPlatform } from '../types';
import { formatPercent } from '../utils';

const PLATFORM_LABEL: Record<ShopPlatform, string> = {
  woocommerce: 'WooCommerce',
  shopify: 'Shopify',
  custom: 'Custom',
};

export function ShopsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [statsById, setStatsById] = useState<Record<string, { completions: number; conversion: number }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; domain: string; platform: ShopPlatform }>({
    name: '',
    domain: '',
    platform: 'woocommerce',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ shops: Shop[] }>('/api/shops');
      setShops(data.shops);
      const entries = await Promise.all(
        data.shops.map(async (shop) => {
          try {
            const { data: a } = await api.get<AnalyticsOverview>('/api/analytics/overview', {
              params: { shopId: shop.id, period: '30d' },
            });
            return [shop.id, { completions: a.completions, conversion: a.conversion_rate }] as const;
          } catch {
            return [shop.id, { completions: 0, conversion: 0 }] as const;
          }
        }),
      );
      setStatsById(Object.fromEntries(entries));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.domain.trim()) {
      toast.error('Domena jest wymagana');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<{ shop: Shop }>('/api/shops', form);
      toast.success('Sklep dodany');
      setModalOpen(false);
      setForm({ name: '', domain: '', platform: 'woocommerce' });
      navigate(`/install/${data.shop.id}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <p className="ff-kicker">Store Network</p>
          <h1 className="ff-page-title">Sklepy</h1>
          <p className="mt-2 text-sm text-ink/65">Każdy sklep ma osobne statystyki, konfigurację widgetu i wdrożenie.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-medium text-ink/70 sm:inline-flex">
            <Sparkles size={13} className="mr-1" /> {shops.length} przestrzeni
          </span>
          <button className="ff-btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Dodaj sklep
          </button>
        </div>
      </section>

      {loading ? (
        <RowsSkeleton rows={3} />
      ) : shops.length === 0 ? (
        <EmptyState
          title="Brak sklepów"
          description="Dodaj pierwszy sklep, aby uruchomić widget i zbierać dane konwersji."
          action={
            <button className="ff-btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Dodaj sklep
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => {
            const stat = statsById[shop.id];
            return (
              <Card key={shop.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{shop.name || shop.domain}</h3>
                    <p className="truncate text-sm text-ink/55">{shop.domain}</p>
                  </div>
                  <StatusBadge status={shop.is_active ? 'active' : 'inactive'} />
                </div>

                <span className="mt-3 inline-flex w-fit rounded-full border border-ink/15 bg-white px-2.5 py-1 text-xs font-medium text-ink/70">
                  {PLATFORM_LABEL[shop.platform]}
                </span>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-ink/12 bg-white p-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-ink/50">Przymiarki</div>
                    <div className="mt-1 text-xl font-bold leading-none text-ink">{stat ? stat.completions : '—'}</div>
                  </div>
                  <div className="rounded-xl border border-ink/12 bg-white p-3">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-ink/50">Konwersja</div>
                    <div className="mt-1 text-xl font-bold leading-none text-ink">{stat ? formatPercent(stat.conversion) : '—'}</div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button className="ff-btn-secondary" onClick={() => navigate(`/shops/${shop.id}`)}>
                    <SettingsIcon size={15} /> Ustawienia
                  </button>
                  <button className="ff-btn-secondary" onClick={() => navigate(`/install/${shop.id}`)}>
                    <Download size={15} /> Instalacja
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Dodaj sklep">
        <form onSubmit={createShop} className="space-y-4">
          <div>
            <label className="ff-label">Nazwa</label>
            <input className="ff-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="ff-label">Domena</label>
            <input
              className="ff-input"
              placeholder="np. mojsklep.pl"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />
          </div>
          <div>
            <label className="ff-label">Platforma</label>
            <select
              className="ff-input"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as ShopPlatform })}
            >
              <option value="woocommerce">WooCommerce</option>
              <option value="shopify">Shopify</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <button type="submit" className="ff-btn-primary w-full" disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Dodaj sklep'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
