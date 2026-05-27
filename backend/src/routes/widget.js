const express = require('express');
const { supabase } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const { authenticateApiKey } = require('../middleware/auth');
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

function normalizeDomain(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

// Public router for the embeddable widget. Auth via X-API-Key.
const router = express.Router();
router.use(authenticateApiKey);

// GET /api/widget/shop?domain=...  → resolve this client's shop id for a domain.
// Used by store plugins to "connect" with only an API key.
router.get('/shop', async (req, res) => {
  if (isMockBackendEnabled()) {
    const shop = findMockShopForDomain(req.clientId, req.query.domain);
    if (!shop) throw new ApiError(404, 'No shop matches this domain');
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
  const { shopId, eventType, productId, sessionId, metadata } = req.body || {};
  if (!shopId || !eventType) throw new ApiError(400, 'shopId and eventType are required');

  if (isMockBackendEnabled()) {
    const ok = trackMockAnalyticsEvent(shopId, req.clientId, eventType);
    if (!ok) throw new ApiError(403, 'Shop does not belong to this API key');
    res.status(201).json({ ok: true });
    return;
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }

  const { error } = await supabase.from('analytics_events').insert({
    shop_id: shopId,
    event_type: eventType,
    product_id: productId || null,
    session_id: sessionId || null,
    metadata: metadata || null,
  });
  if (error) throw error;
  res.status(201).json({ ok: true });
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
