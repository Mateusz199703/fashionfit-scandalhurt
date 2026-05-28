const express = require('express');
const { supabase } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const { markOnboardingProgressAsync } = require('../services/onboarding');
const { authenticateApiKey, requireScope } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const {
  isMockBackendEnabled,
  findMockShopForDomain,
  listMockProducts,
  upsertMockWidgetProducts,
  deactivateMockWidgetProduct,
  trackMockAnalyticsEvent,
} = require('../services/mockStore');
const tryonRoutes = require('./tryon');

const ALLOWED_CATEGORIES = ['tops', 'bottoms', 'one-pieces', 'outerwear', 'accessories'];
const mockTryonSessions = new Map();
const MAX_BATCH_EVENTS = 50;

function normalizeDomain(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

function normalizeEvent(input) {
  if (!input || typeof input !== 'object') return null;
  const shopId = input.shopId || input.shop_id || null;
  const eventType = input.eventType || input.event_type || null;
  if (!shopId || !eventType) return null;
  return {
    shopId: String(shopId),
    eventType: String(eventType),
    productId: input.productId || input.product_id || null,
    sessionId: input.sessionId || input.session_id || null,
    metadata: input.metadata || null,
  };
}

async function markFirstTryonComplete(clientId) {
  markOnboardingProgressAsync(clientId, { step_first_tryon: true });
}

function persistEventsAsync(rows, clientId) {
  setImmediate(async () => {
    if (!rows.length) return;
    const payload = rows.map((event) => ({
      shop_id: event.shopId,
      event_type: event.eventType,
      product_id: event.productId || null,
      session_id: event.sessionId || null,
      metadata: event.metadata || null,
    }));

    try {
      const { error } = await supabase.from('analytics_events').insert(payload);
      if (error) throw error;
    } catch (err) {
      console.warn('widget events insert failed:', err.message);
    }

    if (rows.some((event) => event.eventType === 'tryon_complete')) {
      await markFirstTryonComplete(clientId);
    }
  });
}

async function validateEventShopOwnership(events, clientId) {
  const uniqueShopIds = [...new Set(events.map((e) => e.shopId))];
  for (const shopId of uniqueShopIds) {
    // eslint-disable-next-line no-await-in-loop
    const owned = await isShopOwnedByClient(shopId, clientId);
    if (!owned) {
      throw new ApiError(403, `Shop ${shopId} does not belong to this API key`);
    }
  }
}

// Public router for the embeddable widget. Auth via X-API-Key.
const router = express.Router();
router.use(authenticateApiKey);
router.use(requireScope('widget'));

// GET /api/widget/shop?domain=...  → resolve this client's shop id for a domain.
// Used by store plugins to "connect" with only an API key.
router.get('/shop', async (req, res) => {
  if (isMockBackendEnabled()) {
    const shop = findMockShopForDomain(req.clientId, req.query.domain);
    if (!shop) throw new ApiError(404, 'No shop matches this domain');
    markOnboardingProgressAsync(req.clientId, { step_plugin_installed: true });
    res.json({ shopId: shop.id, name: shop.name, domain: shop.domain });
    return;
  }

  const { data: shops, error } = await supabase
    .from('shops')
    .select('id, name, domain')
    .eq('client_id', req.clientId);
  if (error) throw error;
  if (!shops || shops.length === 0) throw new ApiError(404, 'No shops found for this API key');

  const wanted = normalizeDomain(req.query.domain);
  let shop = wanted ? shops.find((s) => normalizeDomain(s.domain) === wanted) : null;
  if (!shop && shops.length === 1) [shop] = shops;
  if (!shop) throw new ApiError(404, 'No shop matches this domain');
  markOnboardingProgressAsync(req.clientId, { step_plugin_installed: true });

  res.json({ shopId: shop.id, name: shop.name, domain: shop.domain });
});

// POST /api/widget/products/sync  → upsert products pushed from a store plugin.
router.post('/products/sync', async (req, res) => {
  const { shopId, products } = req.body || {};
  if (!shopId || !Array.isArray(products)) {
    throw new ApiError(400, 'shopId and a products[] array are required');
  }

  if (isMockBackendEnabled()) {
    const synced = upsertMockWidgetProducts(shopId, req.clientId, products);
    if (synced === null) throw new ApiError(403, 'Shop does not belong to this API key');
    markOnboardingProgressAsync(req.clientId, {
      step_plugin_installed: true,
      step_products_synced: synced > 0,
    });
    res.json({ synced });
    return;
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }

  const rows = products
    .filter((p) => p && p.external_id != null)
    .map((p) => ({
      shop_id: shopId,
      external_id: String(p.external_id),
      name: p.name || null,
      category: ALLOWED_CATEGORIES.includes(p.category) ? p.category : null,
      garment_image_url: p.garment_image_url || null,
      product_url: p.product_url || null,
      variants: p.variants || null,
      is_synced: true,
      last_synced_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return res.json({ synced: 0 });

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'shop_id,external_id' });
  if (error) throw error;
  markOnboardingProgressAsync(req.clientId, {
    step_plugin_installed: true,
    step_products_synced: rows.length > 0,
  });
  res.json({ synced: rows.length });
});

// POST /api/widget/products/deactivate  → hide a product (e.g. trashed in store).
router.post('/products/deactivate', async (req, res) => {
  const { shopId, external_id: externalId } = req.body || {};
  if (!shopId || externalId == null) {
    throw new ApiError(400, 'shopId and external_id are required');
  }

  if (isMockBackendEnabled()) {
    const ok = deactivateMockWidgetProduct(shopId, req.clientId, externalId);
    if (!ok) throw new ApiError(403, 'Shop does not belong to this API key');
    res.json({ ok: true });
    return;
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }

  const { error } = await supabase
    .from('products')
    .update({ is_synced: false })
    .eq('shop_id', shopId)
    .eq('external_id', String(externalId));
  if (error) throw error;
  res.json({ ok: true });
});

if (isMockBackendEnabled()) {
  router.post('/tryon/photo', async (req, res) => {
    const { shopId, productId } = req.body || {};
    if (!shopId || !productId) throw new ApiError(400, 'shopId and productId are required');
    const products = listMockProducts(shopId, req.clientId);
    if (!products) throw new ApiError(403, 'Shop does not belong to this API key');
    const hasProduct = products.some((p) => String(p.id) === String(productId) || String(p.external_id) === String(productId));
    if (!hasProduct) throw new ApiError(404, 'Product not found');

    const sessionId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    mockTryonSessions.set(sessionId, {
      createdAt: Date.now(),
      resultImageUrl: 'https://placehold.co/900x1200/161616/FFFFFF?text=FashionFit+Try-On+Result',
    });
    res.status(202).json({ sessionId, status: 'processing' });
  });

  router.get('/tryon/status/:sessionId', async (req, res) => {
    const session = mockTryonSessions.get(req.params.sessionId);
    if (!session) throw new ApiError(404, 'Session not found');
    const done = Date.now() - session.createdAt > 3500;
    res.json({
      status: done ? 'completed' : 'processing',
      resultImageUrl: done ? session.resultImageUrl : null,
    });
  });
} else {
  // Try-on endpoints: /api/widget/tryon/photo, /api/widget/tryon/status/:id
  router.use('/tryon', tryonRoutes);
}

// POST /api/widget/events
router.post('/events', async (req, res) => {
  const event = normalizeEvent(req.body || {});
  if (!event) throw new ApiError(400, 'shopId and eventType are required');

  if (isMockBackendEnabled()) {
    const ok = trackMockAnalyticsEvent(event.shopId, req.clientId, event.eventType);
    if (!ok) throw new ApiError(403, 'Shop does not belong to this API key');
    res.status(202).json({ accepted: 1 });
    return;
  }

  if (!(await isShopOwnedByClient(event.shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }
  persistEventsAsync([event], req.clientId);
  res.status(202).json({ accepted: 1 });
});

// POST /api/widget/events/batch
router.post('/events/batch', async (req, res) => {
  const events = Array.isArray(req.body && req.body.events) ? req.body.events : null;
  if (!events) throw new ApiError(400, 'events array is required');
  if (events.length === 0) return res.status(202).json({ accepted: 0 });
  if (events.length > MAX_BATCH_EVENTS) {
    throw new ApiError(400, `Maximum ${MAX_BATCH_EVENTS} events per batch`);
  }

  const normalized = events.map(normalizeEvent).filter(Boolean);
  if (normalized.length !== events.length) {
    throw new ApiError(400, 'Every event must include shopId and eventType');
  }

  if (isMockBackendEnabled()) {
    for (const event of normalized) {
      // eslint-disable-next-line no-await-in-loop
      const ok = trackMockAnalyticsEvent(event.shopId, req.clientId, event.eventType);
      if (!ok) throw new ApiError(403, `Shop ${event.shopId} does not belong to this API key`);
    }
    res.status(202).json({ accepted: normalized.length });
    return;
  }

  await validateEventShopOwnership(normalized, req.clientId);
  persistEventsAsync(normalized, req.clientId);
  res.status(202).json({ accepted: normalized.length });
});

// GET /api/widget/products/:shopId
router.get('/products/:shopId', async (req, res) => {
  if (isMockBackendEnabled()) {
    const products = listMockProducts(req.params.shopId, req.clientId);
    if (!products) throw new ApiError(403, 'Shop does not belong to this API key');
    res.json({
      products: products
        .filter((p) => p.is_synced !== false)
        .map((p) => ({
          id: p.id,
          external_id: p.external_id,
          name: p.name,
          category: p.category,
          garment_image_url: p.garment_image_url || null,
          product_url: p.product_url || null,
          variants: p.variants || null,
        })),
    });
    return;
  }

  if (!(await isShopOwnedByClient(req.params.shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, external_id, name, category, garment_image_url, product_url, variants')
    .eq('shop_id', req.params.shopId)
    .eq('is_synced', true);
  if (error) throw error;
  res.json({ products: data });
});

module.exports = router;
