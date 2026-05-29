const express = require('express');
const { supabase } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const { isMockBackendEnabled, getMockAnalyticsOverview } = require('../services/mockStore');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockBackend = isMockBackendEnabled();
router.use(authenticateJWT);

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };
const CATEGORY_FILTERS = ['all', 'tops', 'bottoms', 'one-pieces', 'outerwear', 'accessories'];
const SIZE_VALUES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const QUALITY_BUCKETS = ['low', 'medium', 'high', 'ultra'];

function normalizeCategoryFilter(input) {
  const raw = String(input || 'all').trim().toLowerCase();
  return CATEGORY_FILTERS.includes(raw) ? raw : null;
}

function toMillis(input) {
  const value = new Date(input).getTime();
  return Number.isFinite(value) ? value : 0;
}

function safeNumber(input) {
  const value = Number(input);
  return Number.isFinite(value) ? value : 0;
}

function round4(value) {
  return Number(Number(value || 0).toFixed(4));
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function parseRatio(numerator, denominator) {
  if (!denominator) return 0;
  return round4(numerator / denominator);
}

function pickCustomerKey(event) {
  const metadata = event && event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
  if (metadata.customer_id != null && metadata.customer_id !== '') {
    return `id:${String(metadata.customer_id)}`;
  }
  const email = metadata.customer_email || metadata.email || null;
  if (email) return `email:${String(email).trim().toLowerCase()}`;
  if (event && event.session_id) return `session:${String(event.session_id)}`;
  return null;
}

function pickSize(event) {
  const metadata = event && event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
  const raw = metadata.size || metadata.selected_size || metadata.variation_size || null;
  if (!raw) return null;
  const normalized = String(raw).trim().toUpperCase();
  return SIZE_VALUES.includes(normalized) ? normalized : null;
}

function pickImageQualityBucketFromMetadata(metadata) {
  const meta = metadata && typeof metadata === 'object' ? metadata : {};
  const explicit = String(meta.image_quality_bucket || '').trim().toLowerCase();
  if (QUALITY_BUCKETS.includes(explicit)) return explicit;

  const width = safeNumber(meta.image_width || meta.imageWidth);
  const height = safeNumber(meta.image_height || meta.imageHeight);
  const megapixels = safeNumber(meta.image_megapixels || meta.imageMegapixels);
  const mp = megapixels > 0 ? megapixels : (width > 0 && height > 0 ? (width * height) / 1000000 : 0);

  if (mp >= 4.5) return 'ultra';
  if (mp >= 2.0) return 'high';
  if (mp >= 0.9) return 'medium';
  if (mp > 0) return 'low';
  return 'unknown';
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sorted = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return round2(sorted[mid]);
  return round2((sorted[mid - 1] + sorted[mid]) / 2);
}

function percentDelta(current, previous) {
  if (!previous && !current) return 0;
  if (!previous) return 1;
  return round4((current - previous) / previous);
}

function toDelta(current, previous) {
  return {
    current,
    previous,
    delta: round2(current - previous),
    delta_pct: percentDelta(current, previous),
  };
}

function eventMatchesCategory(event, category, productMeta) {
  if (category === 'all') return true;
  if (!event.product_id) return false;
  return Boolean(productMeta[event.product_id] && productMeta[event.product_id].category === category);
}

function buildCategoryBreakdown(events, productMeta) {
  const breakdown = {};
  for (const category of CATEGORY_FILTERS) {
    if (category === 'all') continue;
    breakdown[category] = {
      category,
      tryon_completions: 0,
      add_to_carts: 0,
      purchases: 0,
      conversion_rate: 0,
      purchase_rate: 0,
    };
  }

  for (const event of events) {
    if (!event.product_id) continue;
    const meta = productMeta[event.product_id];
    if (!meta || !meta.category || !breakdown[meta.category]) continue;
    const row = breakdown[meta.category];
    if (event.event_type === 'tryon_complete') row.tryon_completions += 1;
    if (event.event_type === 'add_to_cart') row.add_to_carts += 1;
    if (event.event_type === 'purchase') row.purchases += 1;
  }

  for (const row of Object.values(breakdown)) {
    row.conversion_rate = parseRatio(row.add_to_carts, row.tryon_completions);
    row.purchase_rate = parseRatio(row.purchases, row.tryon_completions);
  }

  return Object.values(breakdown).sort((a, b) => b.tryon_completions - a.tryon_completions);
}

function buildSnapshot({ events, sessions, productMeta, category }) {
  const scopedEvents = (events || []).filter((event) => eventMatchesCategory(event, category, productMeta));
  const scopedSessions = (sessions || []).filter((session) => {
    if (category === 'all') return true;
    const meta = productMeta[session.product_id];
    return Boolean(meta && meta.category === category);
  });

  const counts = { widget_open: 0, tryon_start: 0, tryon_complete: 0, add_to_cart: 0, purchase: 0 };
  const byDay = {};
  const byProduct = {};
  const buyersSet = new Set();
  const purchasesForCohorts = [];
  const purchaseEvents = [];
  const tryonCompleteByProduct = {};
  const sizeRows = {};
  for (const size of SIZE_VALUES) {
    sizeRows[size] = { size, tryon_completions: 0, add_to_carts: 0, purchases: 0, conversion_rate: 0, purchase_rate: 0 };
  }

  let revenue = 0;

  for (const event of scopedEvents) {
    if (event.event_type in counts) counts[event.event_type] += 1;

    const day = String(event.created_at || '').slice(0, 10);
    if (day) {
      if (!byDay[day]) {
        byDay[day] = {
          date: day,
          widget_opens: 0,
          tryon_starts: 0,
          tryon_completions: 0,
          add_to_carts: 0,
          purchases: 0,
          revenue: 0,
        };
      }
      if (event.event_type === 'widget_open') byDay[day].widget_opens += 1;
      else if (event.event_type === 'tryon_start') byDay[day].tryon_starts += 1;
      else if (event.event_type === 'tryon_complete') byDay[day].tryon_completions += 1;
      else if (event.event_type === 'add_to_cart') byDay[day].add_to_carts += 1;
      else if (event.event_type === 'purchase') byDay[day].purchases += 1;
    }

    const eventMs = toMillis(event.created_at);
    const size = pickSize(event);
    if (size && sizeRows[size]) {
      if (event.event_type === 'tryon_complete') sizeRows[size].tryon_completions += 1;
      if (event.event_type === 'add_to_cart') sizeRows[size].add_to_carts += 1;
      if (event.event_type === 'purchase') sizeRows[size].purchases += 1;
    }

    if (event.product_id && (event.event_type === 'tryon_complete' || event.event_type === 'add_to_cart' || event.event_type === 'purchase')) {
      if (!byProduct[event.product_id]) {
        byProduct[event.product_id] = {
          product_id: event.product_id,
          tryon_completions: 0,
          add_to_carts: 0,
          purchases: 0,
        };
      }
      if (event.event_type === 'tryon_complete') byProduct[event.product_id].tryon_completions += 1;
      else if (event.event_type === 'add_to_cart') byProduct[event.product_id].add_to_carts += 1;
      else if (event.event_type === 'purchase') byProduct[event.product_id].purchases += 1;
    }

    if (event.event_type === 'tryon_complete' && event.product_id) {
      if (!tryonCompleteByProduct[event.product_id]) tryonCompleteByProduct[event.product_id] = [];
      tryonCompleteByProduct[event.product_id].push(eventMs);
    }

    if (event.event_type === 'purchase') {
      const orderTotal = safeNumber(event.metadata && event.metadata.order_total);
      if (orderTotal > 0) {
        revenue += orderTotal;
        if (day && byDay[day]) byDay[day].revenue += orderTotal;
      }

      const customerKey = pickCustomerKey(event);
      if (customerKey) {
        buyersSet.add(customerKey);
        purchasesForCohorts.push({ customerKey, created_at: event.created_at });
      }

      purchaseEvents.push({
        product_id: event.product_id || null,
        created_ms: eventMs,
      });
    }
  }

  // Time to purchase (nearest previous try-on completion for the same product)
  const lagsHours = [];
  for (const purchase of purchaseEvents) {
    if (!purchase.product_id) continue;
    const list = tryonCompleteByProduct[purchase.product_id] || [];
    let closest = 0;
    for (const candidate of list) {
      if (candidate <= purchase.created_ms && candidate > closest) {
        closest = candidate;
      }
    }
    if (!closest) continue;
    const diffHours = (purchase.created_ms - closest) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours <= 24 * 30) {
      lagsHours.push(diffHours);
    }
  }

  for (const row of Object.values(sizeRows)) {
    row.conversion_rate = parseRatio(row.add_to_carts, row.tryon_completions);
    row.purchase_rate = parseRatio(row.purchases, row.tryon_completions);
  }

  const conversionRate = parseRatio(counts.add_to_cart, counts.tryon_complete);
  const purchaseRate = parseRatio(counts.purchase, counts.tryon_complete);
  const tryonCompletionRate = parseRatio(counts.tryon_complete, counts.tryon_start);
  const cartToPurchaseRate = parseRatio(counts.purchase, counts.add_to_cart);
  const avgOrderValue = counts.purchase ? round2(revenue / counts.purchase) : 0;

  const modeSplit = { photo: 0, live_ar: 0 };
  const qualityRows = {};
  for (const bucket of [...QUALITY_BUCKETS, 'unknown']) {
    qualityRows[bucket] = {
      bucket,
      started: 0,
      completed: 0,
      failed: 0,
      completion_rate: 0,
    };
  }

  for (const session of scopedSessions) {
    if (session.mode === 'photo') modeSplit.photo += 1;
    else if (session.mode === 'live_ar') modeSplit.live_ar += 1;

    if (session.mode === 'photo') {
      const bucket = pickImageQualityBucketFromMetadata(session.metadata);
      const row = qualityRows[bucket] || qualityRows.unknown;
      row.started += 1;
      if (session.status === 'completed') row.completed += 1;
      if (session.status === 'failed') row.failed += 1;
    }
  }

  for (const row of Object.values(qualityRows)) {
    row.completion_rate = parseRatio(row.completed, row.started);
  }

  const topProducts = Object.values(byProduct)
    .map((productStats) => {
      const meta = productMeta[productStats.product_id] || {};
      return {
        ...productStats,
        name: meta.name || null,
        category: meta.category || null,
      };
    })
    .sort((a, b) => b.purchases - a.purchases || b.add_to_carts - a.add_to_carts || b.tryon_completions - a.tryon_completions)
    .slice(0, 10);

  const dailyChartData = Object.values(byDay).sort((a, b) => (a.date < b.date ? -1 : 1));
  const sizeRanking = Object.values(sizeRows)
    .filter((row) => row.tryon_completions > 0 || row.add_to_carts > 0 || row.purchases > 0)
    .sort((a, b) => b.tryon_completions - a.tryon_completions);
  const imageQualityBreakdown = Object.values(qualityRows)
    .filter((row) => row.started > 0)
    .sort((a, b) => b.started - a.started);

  return {
    counts,
    conversionRate,
    purchaseRate,
    tryonCompletionRate,
    cartToPurchaseRate,
    avgOrderValue,
    revenue,
    modeSplit,
    topProducts,
    dailyChartData,
    buyersSet,
    purchasesForCohorts,
    sizeRanking,
    imageQualityBreakdown,
    timeToPurchase: {
      avg_hours: lagsHours.length ? round2(lagsHours.reduce((sum, value) => sum + value, 0) / lagsHours.length) : 0,
      median_hours: median(lagsHours),
      samples: lagsHours.length,
    },
  };
}

function buildComparison(current, previous) {
  return {
    widget_opens: toDelta(current.counts.widget_open, previous.counts.widget_open),
    tryon_starts: toDelta(current.counts.tryon_start, previous.counts.tryon_start),
    completions: toDelta(current.counts.tryon_complete, previous.counts.tryon_complete),
    add_to_carts: toDelta(current.counts.add_to_cart, previous.counts.add_to_cart),
    purchases: toDelta(current.counts.purchase, previous.counts.purchase),
    revenue: toDelta(current.revenue, previous.revenue),
    conversion_rate: toDelta(current.conversionRate, previous.conversionRate),
    purchase_rate: toDelta(current.purchaseRate, previous.purchaseRate),
    tryon_completion_rate: toDelta(current.tryonCompletionRate, previous.tryonCompletionRate),
    cart_to_purchase_rate: toDelta(current.cartToPurchaseRate, previous.cartToPurchaseRate),
  };
}

function buildCohorts(currentPurchases, allPurchaseEvents, sinceMs) {
  const firstPurchaseByCustomer = {};

  for (const event of allPurchaseEvents || []) {
    const key = pickCustomerKey(event);
    if (!key) continue;
    const ts = toMillis(event.created_at);
    if (!firstPurchaseByCustomer[key] || ts < firstPurchaseByCustomer[key]) {
      firstPurchaseByCustomer[key] = ts;
    }
  }

  let newCustomers = 0;
  let returningCustomers = 0;
  for (const purchase of currentPurchases || []) {
    const firstTs = firstPurchaseByCustomer[purchase.customerKey] || 0;
    if (firstTs >= sinceMs) newCustomers += 1;
    else returningCustomers += 1;
  }

  const total = newCustomers + returningCustomers;
  return {
    new_customers: newCustomers,
    returning_customers: returningCustomers,
    total_customers: total,
    new_share: parseRatio(newCustomers, total),
    returning_share: parseRatio(returningCustomers, total),
  };
}

// GET /api/analytics/overview?shopId=...&period=7d|30d|90d&category=all|tops|bottoms|one-pieces|outerwear|accessories
router.get('/overview', async (req, res) => {
  const { shopId } = req.query;
  const period = req.query.period || '30d';
  const category = normalizeCategoryFilter(req.query.category);
  const days = PERIOD_DAYS[period] || 30;
  if (!shopId) throw new ApiError(400, 'shopId query param is required');
  if (!category) throw new ApiError(400, `Invalid category filter. Allowed: ${CATEGORY_FILTERS.join(', ')}`);

  if (useMockBackend) {
    const data = getMockAnalyticsOverview(shopId, req.clientId, period, category);
    if (!data) throw new ApiError(404, 'Shop not found');
    res.json(data);
    return;
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(404, 'Shop not found');
  }

  const nowMs = Date.now();
  const currentSinceMs = nowMs - days * 24 * 60 * 60 * 1000;
  const previousSinceMs = nowMs - 2 * days * 24 * 60 * 60 * 1000;
  const currentSince = new Date(currentSinceMs).toISOString();
  const previousSince = new Date(previousSinceMs).toISOString();
  const currentStartIso = new Date(currentSinceMs).toISOString();

  const [eventsWindowRes, sessionsWindowRes, productsRes, allPurchasesRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event_type, product_id, created_at, session_id, metadata')
      .eq('shop_id', shopId)
      .gte('created_at', previousSince),
    supabase
      .from('tryon_sessions')
      .select('id, mode, status, created_at, completed_at, product_id, metadata')
      .eq('shop_id', shopId)
      .gte('created_at', previousSince),
    supabase
      .from('products')
      .select('id, name, category')
      .eq('shop_id', shopId),
    supabase
      .from('analytics_events')
      .select('event_type, created_at, metadata, session_id')
      .eq('shop_id', shopId)
      .eq('event_type', 'purchase'),
  ]);

  if (eventsWindowRes.error) throw eventsWindowRes.error;
  if (sessionsWindowRes.error) throw sessionsWindowRes.error;
  if (productsRes.error) throw productsRes.error;
  if (allPurchasesRes.error) throw allPurchasesRes.error;

  const productMeta = {};
  for (const product of productsRes.data || []) {
    productMeta[product.id] = { name: product.name || null, category: product.category || null };
  }

  const windowEvents = eventsWindowRes.data || [];
  const windowSessions = sessionsWindowRes.data || [];

  const currentEvents = windowEvents.filter((event) => toMillis(event.created_at) >= currentSinceMs);
  const previousEvents = windowEvents.filter((event) => {
    const ts = toMillis(event.created_at);
    return ts >= previousSinceMs && ts < currentSinceMs;
  });

  const currentSessions = windowSessions.filter((session) => toMillis(session.created_at) >= currentSinceMs);
  const previousSessions = windowSessions.filter((session) => {
    const ts = toMillis(session.created_at);
    return ts >= previousSinceMs && ts < currentSinceMs;
  });

  const currentSnapshot = buildSnapshot({
    events: currentEvents,
    sessions: currentSessions,
    productMeta,
    category,
  });
  const previousSnapshot = buildSnapshot({
    events: previousEvents,
    sessions: previousSessions,
    productMeta,
    category,
  });

  const comparison = buildComparison(currentSnapshot, previousSnapshot);
  const categoryBreakdown = buildCategoryBreakdown(currentEvents, productMeta);
  const cohorts = buildCohorts(
    currentSnapshot.purchasesForCohorts,
    allPurchasesRes.data || [],
    currentSinceMs,
  );

  res.json({
    period,
    period_start: currentStartIso,
    period_compare_start: previousSince,
    category_filter: category,
    widget_opens: currentSnapshot.counts.widget_open,
    tryon_starts: currentSnapshot.counts.tryon_start,
    completions: currentSnapshot.counts.tryon_complete,
    add_to_carts: currentSnapshot.counts.add_to_cart,
    purchases: currentSnapshot.counts.purchase,
    conversion_rate: currentSnapshot.conversionRate,
    purchase_rate: currentSnapshot.purchaseRate,
    tryon_completion_rate: currentSnapshot.tryonCompletionRate,
    cart_to_purchase_rate: currentSnapshot.cartToPurchaseRate,
    average_order_value: currentSnapshot.avgOrderValue,
    buyers_count: currentSnapshot.buyersSet.size || currentSnapshot.counts.purchase,
    revenue: round2(currentSnapshot.revenue),
    mode_split: currentSnapshot.modeSplit,
    top_products: currentSnapshot.topProducts,
    category_breakdown: categoryBreakdown,
    daily_chart_data: currentSnapshot.dailyChartData,
    period_comparison: comparison,
    cohorts,
    time_to_purchase: currentSnapshot.timeToPurchase,
    size_ranking: currentSnapshot.sizeRanking,
    image_quality_breakdown: currentSnapshot.imageQualityBreakdown,
  });
});

module.exports = router;
