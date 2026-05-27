import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, Copy, Check, ArrowLeft, BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card } from '../components/ui';
import { RowsSkeleton } from '../components/Skeleton';
import { Product, Shop, WidgetConfig } from '../types';
import { formatDate } from '../utils';

type Tab = 'products' | 'settings' | 'widget';

export function ShopDetailPage() {
  const { id = '' } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [tab, setTab] = useState<Tab>('products');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ shops: Shop[] }>('/api/shops');
        setShop(data.shops.find((s) => s.id === id) || null);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <RowsSkeleton rows={4} />;
  if (!shop) return <p className="text-sm text-ink/60">Nie znaleziono sklepu.</p>;

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'products', label: 'Produkty' },
    { key: 'settings', label: 'Ustawienia' },
    { key: 'widget', label: 'Widget' },
  ];

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <Link to="/shops" className="mb-2 inline-flex items-center gap-1 text-sm text-ink/55 hover:text-ink">
            <ArrowLeft size={15} /> Sklepy
          </Link>
          <p className="ff-kicker">Store Detail</p>
          <h1 className="ff-page-title">{shop.name || shop.domain}</h1>
          <p className="mt-2 text-sm text-ink/65">{shop.domain}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/analytics/${shop.id}`} className="ff-btn-secondary">
            <BarChart3 size={15} /> Analityka
          </Link>
          <Link to={`/install/${shop.id}`} className="ff-btn-secondary">
            <Download size={15} /> Instalacja
          </Link>
        </div>
      </section>

      <div className="ff-tabbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`ff-tab ${tab === t.key ? 'ff-tab-active' : 'ff-tab-idle'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsTab shopId={id} />}
      {tab === 'settings' && <SettingsTab shop={shop} onSaved={setShop} />}
      {tab === 'widget' && <WidgetTab shopId={id} />}
    </div>
  );
}

function ProductsTab({ shopId }: { shopId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get<{ products: Product[] }>('/api/products', { params: { shopId } });
      setProducts(data.products);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const sync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post<{ synced: number }>(`/api/shops/${shopId}/sync`);
      toast.success(`Zsynchronizowano ${data.synced} produktów`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  const lastSync = products.reduce<string | null>((acc, p) => {
    if (p.last_synced_at && (!acc || p.last_synced_at > acc)) return p.last_synced_at;
    return acc;
  }, null);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
        <span className="text-sm text-ink/60">Ostatnia synchronizacja: {formatDate(lastSync)}</span>
        <button className="ff-btn-primary" onClick={sync} disabled={syncing}>
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} /> Synchronizuj teraz
        </button>
      </Card>

      {loading ? (
        <RowsSkeleton />
      ) : products.length === 0 ? (
        <Card className="p-8 text-center text-sm text-ink/60">Brak zsynchronizowanych produktów.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ff-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Kategoria</th>
                  <th>ID z WooCommerce</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold text-ink">{p.name || '—'}</td>
                    <td>{p.category || '—'}</td>
                    <td className="text-ink/45">{p.external_id || '—'}</td>
                    <td>
                      <span className={p.is_synced ? 'text-ink font-medium' : 'text-ink/45'}>
                        {p.is_synced ? 'zsynchronizowany' : 'nieaktywny'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SettingsTab({ shop, onSaved }: { shop: Shop; onSaved: (s: Shop) => void }) {
  const [cfg, setCfg] = useState<WidgetConfig>({
    primaryColor: shop.widget_config?.primaryColor || '#111111',
    buttonLabel: shop.widget_config?.buttonLabel || 'Przymierz wirtualnie ✨',
    position: shop.widget_config?.position || 'bottom-right',
    showLiveAR: shop.widget_config?.showLiveAR ?? true,
    showPhotoAI: shop.widget_config?.showPhotoAI ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<{ shop: Shop }>(`/api/shops/${shop.id}`, { widget_config: cfg });
      toast.success('Zapisano ustawienia');
      onSaved(data.shop);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-5">
        <h3 className="ff-section-title">Ustawienia widgetu</h3>
        <div>
          <label className="ff-label">Kolor główny</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="h-10 w-14 cursor-pointer rounded-lg border border-ink/20"
              value={cfg.primaryColor}
              onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })}
            />
            <input
              className="ff-input"
              value={cfg.primaryColor}
              onChange={(e) => setCfg({ ...cfg, primaryColor: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="ff-label">Tekst przycisku</label>
          <input className="ff-input" value={cfg.buttonLabel} onChange={(e) => setCfg({ ...cfg, buttonLabel: e.target.value })} />
        </div>
        <div>
          <label className="ff-label">Pozycja</label>
          <select
            className="ff-input"
            value={cfg.position}
            onChange={(e) => setCfg({ ...cfg, position: e.target.value as WidgetConfig['position'] })}
          >
            <option value="bottom-right">Prawy dół</option>
            <option value="bottom-left">Lewy dół</option>
          </select>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={cfg.showPhotoAI} onChange={(e) => setCfg({ ...cfg, showPhotoAI: e.target.checked })} />
            Photo AI
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={cfg.showLiveAR} onChange={(e) => setCfg({ ...cfg, showLiveAR: e.target.checked })} />
            Live AR
          </label>
        </div>
        <button className="ff-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz ustawienia'}
        </button>
      </Card>

      <Card className="relative min-h-[280px] overflow-hidden bg-[#0a0a0a] p-5 text-white">
        <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Podgląd na żywo</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="h-28 rounded-lg bg-white/10" />
          <div className="mt-3 h-3 w-2/3 rounded bg-white/15" />
          <div className="mt-2 h-3 w-1/3 rounded bg-white/15" />
        </div>
        <button
          className="absolute bottom-5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg"
          style={{
            backgroundColor: cfg.primaryColor,
            right: cfg.position === 'bottom-right' ? '1.25rem' : 'auto',
            left: cfg.position === 'bottom-left' ? '1.25rem' : 'auto',
          }}
        >
          {cfg.buttonLabel}
        </button>
      </Card>
    </div>
  );
}

function WidgetTab({ shopId }: { shopId: string }) {
  const [snippet, setSnippet] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ snippet: string }>(`/api/shops/${shopId}/snippet`);
        setSnippet(data.snippet);
      } catch (err) {
        toast.error(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId]);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Skopiowano');
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = useMemo(
    () => [
      'Zaloguj się do panelu WordPress sklepu.',
      'Zainstaluj i aktywuj wtyczkę FashionFit.',
      'Jeśli nie używasz wtyczki: wklej snippet w sekcji head/footer motywu.',
      'Odśwież stronę produktu i sprawdź przycisk „Przymierz wirtualnie”.',
    ],
    [],
  );

  if (loading) return <RowsSkeleton rows={3} />;

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="ff-section-title">Kod instalacyjny</h3>
          <button className="ff-btn-secondary" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Skopiowano' : 'Kopiuj'}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-xl bg-black p-4 text-xs leading-relaxed text-gray-100">
          <code>{snippet}</code>
        </pre>
      </Card>

      <Card className="p-5">
        <h3 className="ff-section-title mb-3">Instrukcja krok po kroku (WordPress)</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/65">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
