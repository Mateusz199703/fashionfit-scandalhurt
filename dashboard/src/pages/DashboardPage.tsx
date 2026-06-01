import React, { useEffect, useMemo, useState } from 'react';
import { Shirt, ShoppingCart, Gauge, Wallet, Lightbulb, Search, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { AnalyticsOverview, BillingOverview, OnboardingProgress, Shop } from '../types';
import { formatMoney, formatPercent } from '../utils';

interface ShopStat {
  shop: Shop;
  completions: number;
  conversion: number;
}

function toPolyline(values: number[]) {
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
}

function metricDelta(values: number[]) {
  if (values.length < 14) return null;
  const recent = values.slice(-7).reduce((acc, x) => acc + x, 0);
  const previous = values.slice(-14, -7).reduce((acc, x) => acc + x, 0);
  if (previous <= 0) return recent > 0 ? 100 : 0;
  return ((recent - previous) / previous) * 100;
}

export function DashboardPage() {
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

        setStats(shopStats);
        setTotals({ completions, addToCarts, purchases, buyers, revenue });
        setSeries({
          completions: completionSeries,
          addToCarts: cartSeries,
          purchases: purchaseSeries,
          revenue: revenueSeries,
        });
        setDeltas({
          completions: metricDelta(completionSeries),
          addToCarts: metricDelta(cartSeries),
          purchases: metricDelta(purchaseSeries),
          revenue: metricDelta(revenueSeries),
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

  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const conversion = totals.completions ? totals.addToCarts / totals.completions : 0;
  const lookConversion = totals.addToCarts ? totals.purchases / totals.addToCarts : 0;
  const activeShops = stats.filter((s) => s.shop.is_active).length;
  const averageBasket = totals.purchases > 0 ? totals.revenue / totals.purchases : null;

  const chartSeriesA = useMemo(() => series.completions.slice(-14), [series.completions]);
  const chartSeriesB = useMemo(() => series.purchases.slice(-14), [series.purchases]);
  const polylineA = toPolyline(chartSeriesA);
  const polylineB = toPolyline(chartSeriesB);

  const insights = [
    conversion >= 0.12
      ? `Świetny wynik: konwersja po przymiarce wynosi ${formatPercent(conversion)}.`
      : `Konwersja po przymiarce to ${formatPercent(conversion)}. Warto przetestować lepsze zdjęcia produktów.`,
    totals.purchases > 0
      ? `Klienci po przymiarce zrealizowali ${totals.purchases} zakupów.`
      : 'Brak zakupów po przymiarce w ostatnich 30 dniach.',
  ];

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

  const metrics = [
    { label: 'Konwersja', value: formatPercent(conversion), delta: deltas.addToCarts, icon: <ShoppingCart size={14} />, spark: series.addToCarts.slice(-12), sparkColor: 'var(--green)' },
    { label: 'Zwroty', value: '—', delta: null, icon: <Wallet size={14} />, spark: series.purchases.slice(-12), sparkColor: 'var(--green)' },
    { label: 'Śr. wartość koszyka', value: averageBasket !== null ? formatMoney(averageBasket) : '—', delta: deltas.revenue, icon: <Gauge size={14} />, spark: series.revenue.slice(-12), sparkColor: 'var(--accent)' },
    { label: 'Trafność rozmiaru', value: '—', delta: null, icon: <Shirt size={14} />, spark: series.completions.slice(-12), sparkColor: 'var(--accent)' },
  ];

  const sparklinePath = (points: number[]) => {
    if (points.length < 2) return '';
    const max = Math.max(1, ...points);
    const min = Math.min(...points, 0);
    const range = Math.max(1, max - min);
    return points
      .map((point, i) => {
        const x = points.length === 1 ? 0 : (i / (points.length - 1)) * 74;
        const y = 34 - ((point - min) / range) * 34;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const deltaClass = (value: number | null) => {
    if (value === null) return 'kd warn';
    return value >= 0 ? 'kd up' : 'kd left';
  };

  const deltaLabel = (value: number | null) => {
    if (value === null) return 'dane niedostępne';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}% vs 7 dni`;
  };

  const demoConversations = [
    { initials: 'KW', name: 'Karolina W.', ago: '2 min temu', query: 'Sukienka na letnie wesele, romantyczna', size: 'M', status: 'Kupiła look', statusClass: 'buy', value: '876 zł' },
    { initials: 'MT', name: 'Marta T.', ago: '11 min temu', query: 'Marynarka do biura, oversize', size: 'L', status: 'W koszyku', statusClass: 'cart', value: '329 zł' },
    { initials: 'AN', name: 'Anna N.', ago: '24 min temu', query: 'Jeansy — który rozmiar przy 170 cm?', size: '28', status: 'Kupiła', statusClass: 'buy', value: '259 zł' },
    { initials: 'JZ', name: 'Julia Z.', ago: '38 min temu', query: 'Stylizacja na koncert, wieczorowa', size: 'S', status: 'Porzuciła', statusClass: 'left', value: '—' },
  ] as const;

  return (
    <div>
      <div className="pagehead">
        <div>
          <h1>Pulpit</h1>
          <div className="sub">Dzisiaj: {today} · Ostatnia synchronizacja: {loading ? 'trwa' : 'aktualna'}</div>
        </div>
        <div className="right">
          <div className="search" aria-hidden="true">
            <Search size={15} />
            <span>Szukaj sklepu lub metryki</span>
          </div>
          <div className="seg" aria-hidden="true">
            <button type="button">7 dni</button>
            <button type="button" className="on">30 dni</button>
            <button type="button">Kwartał</button>
          </div>
          <button type="button" className="barbtn" aria-label="Powiadomienia">
            <Bell size={16} />
          </button>
        </div>
      </div>

      <div className="kgrid">
        {metrics.map((metric) => (
          <div key={metric.label} className="kcard">
            <div className="kt">
              <span className="ki">{metric.icon}</span>
              {metric.label}
            </div>
            <div className="kv">{loading ? '—' : metric.value}</div>
            <div className={deltaClass(metric.delta)}>{loading ? 'ładowanie…' : deltaLabel(metric.delta)}</div>
            <svg viewBox="0 0 74 34" className="spark" aria-hidden="true">
              <polyline
                points={sparklinePath(metric.spark)}
                fill="none"
                stroke={metric.sparkColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>

      <div className="row2">
        <div className="card">
          <div className="ch">
            <h3>Konwersja vs zwroty</h3>
            <div className="legend">
              <span><i style={{ background: '#7B61FF' }} />Konwersja</span>
              <span><i style={{ background: '#FB7185' }} />Zwroty</span>
            </div>
          </div>
          <div className="chart-wrap">
            {loading || !polylineA || !polylineB ? (
              <div className="empty">Ładowanie wykresu...</div>
            ) : (
              <svg viewBox="0 0 100 100" role="img" aria-label="Konwersja i zwroty, ostatnie 14 dni">
                <defs>
                  <linearGradient id="gA" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#7B61FF" />
                    <stop offset="55%" stopColor="#8B5CFF" />
                    <stop offset="100%" stopColor="#FFB15C" />
                  </linearGradient>
                  <linearGradient id="aA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(123,97,255,.25)" />
                    <stop offset="100%" stopColor="rgba(123,97,255,0)" />
                  </linearGradient>
                </defs>
                <g className="grid">
                  {[18, 38, 58, 78].map((line) => (
                    <line key={line} x1="0" y1={line} x2="100" y2={line} />
                  ))}
                </g>
                <polyline points={`${polylineA} 100,100 0,100`} className="areaA" />
                <polyline points={polylineA} className="lineA" />
                <polyline points={polylineB} className="lineB" />
              </svg>
            )}
          </div>
        </div>

        <div className="card">
          <div className="ch">
            <h3>Looki → zakup</h3>
            <span className="tag">Udział finalizacji</span>
          </div>
          <div className="donut-wrap">
            <div
              className="donut"
              style={{ background: `conic-gradient(var(--accent) 0 ${Math.round(lookConversion * 100)}%, var(--surface-2) ${Math.round(lookConversion * 100)}% 100%)` }}
            >
              <div className="din">
                <b>{Math.round(lookConversion * 100)}%</b>
                <span>konwersja looków</span>
              </div>
            </div>
            <div className="dleg">
              <div className="dl"><i style={{ background: '#7b61ff' }} />Kupiony look <b>{Math.round(lookConversion * 100)}%</b></div>
              <div className="dl"><i style={{ background: '#ffb15c' }} />W koszyku <b>{formatPercent(conversion)}</b></div>
              <div className="dl"><i style={{ background: 'rgba(20,20,28,0.24)' }} />Bez zakupu <b>{Math.max(0, 100 - Math.round(lookConversion * 100))}%</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="insight">
        <div className="ic"><Lightbulb size={22} /></div>
        <div>
          <div className="tag">INSIGHT AI · wykryty wzorzec</div>
          <p>{insights[0]}</p>
        </div>
        <button type="button" className="act" disabled>
          Włącz auto-look (wkrótce)
        </button>
      </div>

      <div className="row3">
        <div className="card">
          <div className="ch">
            <h3>Ostatnie rozmowy z AI stylistą</h3>
            <span className="tag">demo</span>
          </div>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Klient</th>
                  <th>Zapytanie</th>
                  <th>Rozmiar</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Wartość</th>
                </tr>
              </thead>
              <tbody>
                {demoConversations.map((row) => (
                  <tr key={`${row.initials}-${row.name}`}>
                    <td>
                      <div className="cust">
                        <span className="ca">{row.initials}</span>
                        <div>
                          <b>{row.name}</b>
                          <span>{row.ago}</span>
                        </div>
                      </div>
                    </td>
                    <td className="q-txt">{row.query}</td>
                    <td><span className="szbadge">{row.size}</span></td>
                    <td>
                      <span className={`pill ${row.statusClass}`}>
                        {row.statusClass === 'buy' ? <span className="dot-live" /> : null}
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}><span className="val">{row.value}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-note">Dane demonstracyjne układu tabeli (nie jest to feed live).</div>
        </div>

        <div className="card synccard">
          <div className="ch">
            <h3>Status integracji</h3>
            <span className="tag">Kanały sprzedaży</span>
          </div>

          {integrationRows.map((row) => (
            <div key={row.name} className="sg">
              <div className="si" style={{ background: row.tone === 'ok' ? 'linear-gradient(120deg,var(--accent),var(--accent2))' : '#111827' }}>
                {row.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <b>{row.name}</b>
                <span>{row.description}</span>
              </div>
              <div className={`st ${row.tone === 'ok' ? 'ok' : 'soon'}`}>
                {row.tone === 'ok' ? <span className="dot-live" /> : null}
                {row.status}
              </div>
            </div>
          ))}

          <div className="mini-stats">
            <div>Aktywne sklepy: <b>{activeShops}</b></div>
            <div>Kupujący klienci: <b>{totals.buyers}</b></div>
            {billing ? <div>Pozostałe try-ony: <b>{Math.max(0, billing.usage.limit - billing.usage.used)}</b></div> : null}
          </div>
        </div>
      </div>

      {insights[1] ? <div className="footnote">{insights[1]}</div> : null}
    </div>
  );
}
