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

function normalizeCategoryFilter(input) {
  const raw = String(input || 'all').trim().toLowerCase();
  return CATEGORY_FILTERS.includes(raw) ? raw : null;
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

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('event_type, product_id, created_at, session_id, metadata')
    .eq('shop_id', shopId)
    .gte('created_at', since);
  if (error) throw error;

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, category')
    .eq('shop_id', shopId);
  if (productsError) throw productsError;

  const productMeta = {};
  for (const product of products || []) {
    productMeta[product.id] = { name: product.name || null, category: product.category || null };
  }

  const rawEvents = events || [];
  const scopedEvents = category === 'all'
    ? rawEvents
    : rawEvents.filter((event) => {
        if (!event.product_id) return false;
        return (productMeta[event.product_id] && productMeta[event.product_id].category === category);
      });

  const counts = { widget_open: 0, tryon_start: 0, tryon_complete: 0, add_to_cart: 0, purchase: 0 };
  const byDay = {};
  const byProduct = {};
  const categoryBreakdown = {};
  for (const item of CATEGORY_FILTERS) {
    if (item === 'all') continue;
    categoryBreakdown[item] = { category: item, tryon_completions: 0, add_to_carts: 0, purchases: 0, conversion_rate: 0 };
  }
  const buyers = new Set();
  let revenue = 0;

  for (const event of scopedEvents) {
    if (event.event_type in counts) counts[event.event_type] += 1;

    const day = event.created_at.slice(0, 10);
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

    if (event.event_type === 'purchase') {
      const meta = event.metadata || {};
      const candidate = meta.customer_id || meta.customer_email || meta.email || event.session_id || null;
      if (candidate) buyers.add(String(candidate));

      const orderTotal = Number(meta.order_total);
      if (Number.isFinite(orderTotal)) {
        revenue += orderTotal;
        byDay[day].revenue += orderTotal;
      }
    }

    if (event.product_id && (event.event_type === 'tryon_complete' || event.event_type === 'add_to_cart' || event.event_type === 'purchase')) {
      if (!byProduct[event.product_id]) {
        byProduct[event.product_id] = { product_id: event.product_id, tryon_completions: 0, add_to_carts: 0, purchases: 0 };
      }
      if (event.event_type === 'tryon_complete') byProduct[event.product_id].tryon_completions += 1;
      else if (event.event_type === 'add_to_cart') byProduct[event.product_id].add_to_carts += 1;
      else byProduct[event.product_id].purchases += 1;
    }
  }

  for (const event of rawEvents) {
    if (!event.product_id) continue;
    const product = productMeta[event.product_id];
    const productCategory = product && product.category;
    if (!productCategory || !categoryBreakdown[productCategory]) continue;
    if (event.event_type === 'tryon_complete') categoryBreakdown[productCategory].tryon_completions += 1;
    if (event.event_type === 'add_to_cart') categoryBreakdown[productCategory].add_to_carts += 1;
    if (event.event_type === 'purchase') categoryBreakdown[productCategory].purchases += 1;
  }
  for (const key of Object.keys(categoryBreakdown)) {
    const row = categoryBreakdown[key];
    row.conversion_rate = row.tryon_completions
      ? Number((row.add_to_carts / row.tryon_completions).toFixed(4))
      : 0;
  }

  const conversionRate = counts.tryon_complete
    ? Number((counts.add_to_cart / counts.tryon_complete).toFixed(4))
    : 0;
  const purchaseRate = counts.tryon_complete
    ? Number((counts.purchase / counts.tryon_complete).toFixed(4))
    : 0;
  const tryonCompletionRate = counts.tryon_start
    ? Number((counts.tryon_complete / counts.tryon_start).toFixed(4))
    : 0;
  const cartToPurchaseRate = counts.add_to_cart
    ? Number((counts.purchase / counts.add_to_cart).toFixed(4))
    : 0;
  const avgOrderValue = counts.purchase
    ? Number((revenue / counts.purchase).toFixed(2))
    : 0;

  const { data: sessions, error: sessionsError } = await supabase
    .from('tryon_sessions')
    .select('mode, product_id')
    .eq('shop_id', shopId)
    .gte('created_at', since);
  if (sessionsError) throw sessionsError;

  const modeSplit = { photo: 0, live_ar: 0 };
  for (const session of sessions || []) {
    if (category !== 'all') {
      const sessionProduct = productMeta[session.product_id];
      if (!sessionProduct || sessionProduct.category !== category) continue;
    }
    if (session.mode === 'photo') modeSplit.photo += 1;
    else if (session.mode === 'live_ar') modeSplit.live_ar += 1;
  }

  const topProducts = Object.values(byProduct)
    .map((p) => {
      const meta = productMeta[p.product_id] || {};
      return { ...p, name: meta.name || null, category: meta.category || null };
    })
    .sort((a, b) => b.purchases - a.purchases || b.add_to_carts - a.add_to_carts || b.tryon_completions - a.tryon_completions)
    .slice(0, 10);

  const dailyChartData = Object.values(byDay).sort((a, b) => (a.date < b.date ? -1 : 1));
  const categoryBreakdownList = Object.values(categoryBreakdown)
    .sort((a, b) => b.tryon_completions - a.tryon_completions);

  res.json({
    period,
    category_filter: category,
    widget_opens: counts.widget_open,
    tryon_starts: counts.tryon_start,
    completions: counts.tryon_complete,
    add_to_carts: counts.add_to_cart,
    purchases: counts.purchase,
    conversion_rate: conversionRate,
    purchase_rate: purchaseRate,
    tryon_completion_rate: tryonCompletionRate,
    cart_to_purchase_rate: cartToPurchaseRate,
    average_order_value: avgOrderValue,
    buyers_count: buyers.size || counts.purchase,
    revenue: Number(revenue.toFixed(2)),
    mode_split: modeSplit,
    top_products: topProducts,
    category_breakdown: categoryBreakdownList,
    daily_chart_data: dailyChartData,
  });
});

module.exports = router;
