import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, Copy, Check, ArrowLeft, BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card } from '../components/ui';
import { RowsSkeleton } from '../components/Skeleton';
import { AdvisorTone, Product, Shop, WidgetConfig } from '../types';
import { formatDate } from '../utils';

type Tab = 'products' | 'settings' | 'advisor' | 'widget';

const ADVISOR_MODULE_KEY = 'ai_stylist_advisor';
const ADVISOR_WELCOME_MAX_LENGTH = 300;
const ADVISOR_MIN_RECOMMENDATIONS = 1;
const ADVISOR_MAX_RECOMMENDATIONS = 3;

type AdvisorSettingsForm = {
  tone: AdvisorTone;
  welcomeMessage: string;
  maxRecommendations: number;
};

type ModuleSnapshot = {
  modules?: Array<{
    key: string;
    enabled: boolean;
    source: string;
  }>;
};

type AdvisorConversation = {
  id: string;
  preview: string;
  updatedAt: string | null;
  messageCount: number | null;
};

function clampRecommendations(value: number): number {
  if (!Number.isFinite(value)) return ADVISOR_MAX_RECOMMENDATIONS;
  return Math.min(ADVISOR_MAX_RECOMMENDATIONS, Math.max(ADVISOR_MIN_RECOMMENDATIONS, Math.round(value)));
}

function normalizeAdvisorSettings(config: WidgetConfig | null | undefined): AdvisorSettingsForm {
  const advisor = config && config.advisor ? config.advisor : {};
  const toneCandidate = advisor && advisor.tone ? advisor.tone : 'friendly';
  const tone = toneCandidate === 'neutral' || toneCandidate === 'friendly' || toneCandidate === 'luxury'
    ? toneCandidate
    : 'friendly';

  const welcomeMessage = String(advisor && advisor.welcomeMessage ? advisor.welcomeMessage : '').slice(0, ADVISOR_WELCOME_MAX_LENGTH);
  const maxRecommendations = clampRecommendations(Number(advisor && advisor.maxRecommendations));

  return {
    tone,
    welcomeMessage,
    maxRecommendations,
  };
}

function parseConversationRow(row: unknown): AdvisorConversation | null {
  if (!row || typeof row !== 'object') return null;
  const raw = row as Record<string, unknown>;
  const id = raw.id ? String(raw.id) : '';
  if (!id) return null;

  const previewCandidates = [raw.preview, raw.lastMessage, raw.last_message, raw.reply];
  const preview = previewCandidates.find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  const updatedAt = raw.updated_at || raw.updatedAt || raw.created_at || raw.createdAt;
  const messageCountRaw = raw.message_count ?? raw.messageCount;

  return {
    id,
    preview: preview ? String(preview) : 'Brak podglądu wiadomości.',
    updatedAt: updatedAt ? String(updatedAt) : null,
    messageCount: Number.isFinite(Number(messageCountRaw)) ? Number(messageCountRaw) : null,
  };
}

function isUnavailableEndpointError(error: unknown): boolean {
  const err = error as { response?: { status?: number }; code?: string };
  return err?.response?.status === 404 || err?.code === 'NOT_FOUND';
}

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
    { key: 'advisor', label: 'AI Stylist' },
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
      {tab === 'advisor' && <AdvisorTab shop={shop} onSaved={setShop} />}
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
  const [cfg, setCfg] = useState<WidgetConfig>(() => ({
    ...(shop.widget_config || {}),
    primaryColor: shop.widget_config?.primaryColor || '#111111',
    buttonLabel: shop.widget_config?.buttonLabel || 'Przymierz wirtualnie ✨',
    position: shop.widget_config?.position || 'bottom-right',
    showLiveAR: shop.widget_config?.showLiveAR ?? true,
    showPhotoAI: shop.widget_config?.showPhotoAI ?? true,
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCfg({
      ...(shop.widget_config || {}),
      primaryColor: shop.widget_config?.primaryColor || '#111111',
      buttonLabel: shop.widget_config?.buttonLabel || 'Przymierz wirtualnie ✨',
      position: shop.widget_config?.position || 'bottom-right',
      showLiveAR: shop.widget_config?.showLiveAR ?? true,
      showPhotoAI: shop.widget_config?.showPhotoAI ?? true,
    });
  }, [shop]);

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

function AdvisorTab({ shop, onSaved }: { shop: Shop; onSaved: (s: Shop) => void }) {
  const [settings, setSettings] = useState<AdvisorSettingsForm>(() => normalizeAdvisorSettings(shop.widget_config));
  const [moduleLoading, setModuleLoading] = useState(true);
  const [moduleError, setModuleError] = useState('');
  const [advisorEnabled, setAdvisorEnabled] = useState(false);
  const [moduleSource, setModuleSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [conversations, setConversations] = useState<AdvisorConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [conversationsUnavailable, setConversationsUnavailable] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSettings(normalizeAdvisorSettings(shop.widget_config));
  }, [shop]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setModuleLoading(true);
      setModuleError('');
      setConversationsError('');
      setConversationsUnavailable(false);
      setConversationsLoading(false);

      try {
        const { data } = await api.get<ModuleSnapshot>('/api/modules', { params: { shopId: shop.id } });
        if (!mounted) return;

        const moduleEntry = (data.modules || []).find((item) => item && item.key === ADVISOR_MODULE_KEY);
        const isEnabled = Boolean(moduleEntry && moduleEntry.enabled);
        setAdvisorEnabled(isEnabled);
        setModuleSource(moduleEntry && moduleEntry.source ? moduleEntry.source : null);

        if (!isEnabled) {
          setConversations([]);
          return;
        }

        setConversationsLoading(true);
        try {
          const response = await api.get<{ conversations?: unknown[] }>('/api/advisor/conversations', {
            params: { shopId: shop.id, limit: 10 },
          });
          if (!mounted) return;
          const rows = Array.isArray(response.data && response.data.conversations) ? response.data.conversations : [];
          const parsed = rows.map(parseConversationRow).filter((item): item is AdvisorConversation => Boolean(item));
          setConversations(parsed);
        } catch (err) {
          if (!mounted) return;
          if (isUnavailableEndpointError(err)) {
            setConversationsUnavailable(true);
            setConversations([]);
          } else {
            setConversationsError(apiErrorMessage(err, 'Nie udało się pobrać ostatnich rozmów.'));
          }
        } finally {
          if (mounted) setConversationsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        setAdvisorEnabled(false);
        setModuleSource(null);
        setConversations([]);
        setModuleError(apiErrorMessage(err, 'Nie udało się pobrać statusu modułu.'));
      } finally {
        if (mounted) setModuleLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [shop.id, reloadKey]);

  const saveAdvisorSettings = async () => {
    const cleanedWelcome = settings.welcomeMessage.slice(0, ADVISOR_WELCOME_MAX_LENGTH);
    const clampedMaxRecommendations = clampRecommendations(settings.maxRecommendations);
    const mergedWidgetConfig: WidgetConfig = {
      ...(shop.widget_config || {}),
      advisor: {
        tone: settings.tone,
        welcomeMessage: cleanedWelcome,
        maxRecommendations: clampedMaxRecommendations,
      },
    };

    setSaving(true);
    try {
      const { data } = await api.put<{ shop: Shop }>(`/api/shops/${shop.id}`, {
        widget_config: mergedWidgetConfig,
      });
      onSaved(data.shop);
      setSettings(normalizeAdvisorSettings(data.shop.widget_config));
      toast.success('Zapisano ustawienia AI Stylist');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Nie udało się zapisać ustawień AI Stylist.'));
    } finally {
      setSaving(false);
    }
  };

  const hasModuleError = Boolean(moduleError);
  const disabled = moduleLoading || hasModuleError || !advisorEnabled || saving;
  const currentWelcomeLength = settings.welcomeMessage.length;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="ff-section-title">Status modułu AI Stylist Advisor</h3>
            <p className="mt-1 text-sm text-ink/60">
              {moduleLoading
                ? 'Sprawdzam dostępność modułu dla tego sklepu...'
                : hasModuleError
                  ? 'Wystąpił błąd podczas sprawdzania dostępności modułu.'
                  : advisorEnabled
                    ? `Moduł aktywny${moduleSource ? ` (${moduleSource})` : ''}.`
                    : 'Moduł jest zablokowany w bieżącym planie.'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              moduleLoading
                ? 'border border-ink/20 bg-white/70 text-ink/60'
                : hasModuleError
                  ? 'border border-red-300 bg-red-50 text-red-700'
                  : advisorEnabled
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-300 bg-amber-50 text-amber-700'
            }`}
          >
            {moduleLoading ? 'SPRAWDZANIE' : hasModuleError ? 'BŁĄD' : advisorEnabled ? 'AKTYWNY' : 'ZABLOKOWANY'}
          </span>
        </div>
        {moduleError ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-red-600">{moduleError}</p>
            <button className="ff-btn-secondary" onClick={() => setReloadKey((value) => value + 1)}>
              Spróbuj ponownie
            </button>
          </div>
        ) : null}
      </Card>

      {!moduleLoading && !hasModuleError && !advisorEnabled ? (
        <Card className="border border-amber-300 bg-amber-50 p-5">
          <h4 className="ff-section-title text-amber-800">AI Stylist niedostępny w tym planie</h4>
          <p className="mt-2 text-sm text-amber-800/90">
            Aby odblokować ustawienia i rozmowy AI Stylist Advisor, przejdź na plan zawierający ten moduł.
          </p>
          <div className="mt-4">
            <Link to="/billing" className="ff-btn-primary inline-flex">
              Przejdź do planów i upgrade
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="space-y-4 p-5">
        <h3 className="ff-section-title">Ustawienia AI Stylist</h3>
        <div>
          <label className="ff-label">Ton asystenta</label>
          <select
            className="ff-input"
            value={settings.tone}
            disabled={disabled}
            onChange={(e) => setSettings((prev) => ({ ...prev, tone: e.target.value as AdvisorTone }))}
          >
            <option value="friendly">Przyjazny</option>
            <option value="neutral">Neutralny</option>
            <option value="luxury">Premium / Luxury</option>
          </select>
        </div>

        <div>
          <label className="ff-label">Wiadomość powitalna</label>
          <textarea
            className="ff-input min-h-[110px]"
            value={settings.welcomeMessage}
            disabled={disabled}
            maxLength={ADVISOR_WELCOME_MAX_LENGTH}
            onChange={(e) => setSettings((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
            placeholder="Np. Cześć! Napisz, jakiej stylizacji szukasz, a dobiorę propozycje z Twojego katalogu."
          />
          <p className="mt-1 text-xs text-ink/55">
            {currentWelcomeLength}/{ADVISOR_WELCOME_MAX_LENGTH}
          </p>
        </div>

        <div>
          <label className="ff-label">Maksymalna liczba rekomendacji</label>
          <input
            type="number"
            className="ff-input max-w-[160px]"
            value={settings.maxRecommendations}
            disabled={disabled}
            min={ADVISOR_MIN_RECOMMENDATIONS}
            max={ADVISOR_MAX_RECOMMENDATIONS}
            onChange={(e) => {
              const rawValue = Number(e.target.value);
              setSettings((prev) => ({
                ...prev,
                maxRecommendations: clampRecommendations(rawValue),
              }));
            }}
          />
          <p className="mt-1 text-xs text-ink/55">Zakres: {ADVISOR_MIN_RECOMMENDATIONS}–{ADVISOR_MAX_RECOMMENDATIONS}</p>
        </div>

        <button
          className="ff-btn-primary"
          onClick={saveAdvisorSettings}
          disabled={disabled}
        >
          {saving ? 'Zapisywanie...' : 'Zapisz ustawienia AI Stylist'}
        </button>
      </Card>

      <Card className="p-5">
        <h3 className="ff-section-title">Ostatnie rozmowy AI Stylist</h3>
        {conversationsLoading ? <p className="mt-3 text-sm text-ink/60">Ładowanie rozmów...</p> : null}
        {!conversationsLoading && conversationsUnavailable ? (
          <p className="mt-3 text-sm text-ink/60">Not available yet.</p>
        ) : null}
        {!conversationsLoading && !conversationsUnavailable && conversationsError ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-red-600">{conversationsError}</p>
            <button className="ff-btn-secondary" onClick={() => setReloadKey((value) => value + 1)}>
              Spróbuj ponownie
            </button>
          </div>
        ) : null}
        {!conversationsLoading && !conversationsUnavailable && !conversationsError && conversations.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Brak rozmów dla tego sklepu.</p>
        ) : null}
        {!conversationsLoading && !conversationsUnavailable && !conversationsError && conversations.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="ff-table min-w-[620px]">
              <thead>
                <tr>
                  <th>ID rozmowy</th>
                  <th>Podgląd</th>
                  <th>Wiadomości</th>
                  <th>Ostatnia aktywność</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs text-ink/70">{item.id}</td>
                    <td className="text-ink/85">{item.preview}</td>
                    <td>{item.messageCount == null ? '—' : item.messageCount}</td>
                    <td>{formatDate(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
