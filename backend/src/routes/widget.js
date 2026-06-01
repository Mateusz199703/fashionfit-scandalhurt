const express = require('express');
const { supabase } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const { getModuleAccessSnapshot } = require('../services/moduleAccess');
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
const { createAdvisorRouter } = require('./advisor');

const ALLOWED_CATEGORIES = ['tops', 'bottoms', 'one-pieces', 'outerwear', 'accessories'];
const mockTryonSessions = new Map();
const MAX_BATCH_EVENTS = 50;
const MAX_SHORT_TEXT = 255;
const MAX_MEDIUM_TEXT = 2000;
const MAX_LONG_TEXT = 12000;
const MAX_LIST_SIZE = 64;
const MAX_GALLERY_IMAGES = 32;
const MAX_VARIANTS = 120;
const MAX_JSON_DEPTH = 6;
const MAX_JSON_NODES = 1500;

function normalizeDomain(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

function hasOwn(obj, key) {
  return Boolean(obj && Object.prototype.hasOwnProperty.call(obj, key));
}

function sanitizeString(value, maxLen = MAX_MEDIUM_TEXT) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function sanitizeUrl(value) {
  const normalized = sanitizeString(value, MAX_LONG_TEXT);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch (_) {
    return null;
  }
}

function sanitizeNumeric(value) {
  if (value == null || value === '') return null;
  const asNumber = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(asNumber)) return null;
  return Math.round(asNumber * 100) / 100;
}

function sanitizeInteger(value) {
  if (value == null || value === '') return null;
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) return null;
  return Math.round(asNumber);
}

function sanitizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value == null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'tak'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'nie'].includes(normalized)) return false;
  return null;
}

function normalizeJsonNode(value, state, depth = 0) {
  if (state.count > MAX_JSON_NODES) return null;
  if (depth > MAX_JSON_DEPTH) return null;

  if (value == null) return null;
  if (typeof value === 'string') {
    state.count += 1;
    return value.slice(0, MAX_LONG_TEXT);
  }
  if (typeof value === 'number') {
    state.count += 1;
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'boolean') {
    state.count += 1;
    return value;
  }
  if (Array.isArray(value)) {
    state.count += 1;
    const out = [];
    for (const item of value.slice(0, MAX_LIST_SIZE)) {
      const next = normalizeJsonNode(item, state, depth + 1);
      if (next !== null) out.push(next);
    }
    return out;
  }
  if (typeof value === 'object') {
    state.count += 1;
    const out = {};
    const entries = Object.entries(value).slice(0, MAX_LIST_SIZE * 2);
    for (const [key, item] of entries) {
      const safeKey = sanitizeString(key, 120);
      if (!safeKey) continue;
      const next = normalizeJsonNode(item, state, depth + 1);
      if (next !== null) out[safeKey] = next;
    }
    return out;
  }
  return null;
}

function sanitizeJson(value) {
  if (value == null) return null;
  const normalized = normalizeJsonNode(value, { count: 0 }, 0);
  return normalized == null ? null : normalized;
}

function sanitizeStringList(value, maxLen = MAX_SHORT_TEXT, maxItems = MAX_LIST_SIZE) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (const item of value.slice(0, maxItems)) {
    const clean = sanitizeString(item, maxLen);
    if (!clean) continue;
    out.push(clean);
  }
  return out.length > 0 ? out : null;
}

function sanitizeTags(value) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (const item of value.slice(0, MAX_LIST_SIZE)) {
    if (item && typeof item === 'object') {
      const name = sanitizeString(item.name, MAX_SHORT_TEXT);
      const slug = sanitizeString(item.slug, MAX_SHORT_TEXT);
      if (name || slug) out.push({ name: name || null, slug: slug || null });
      continue;
    }
    const name = sanitizeString(item, MAX_SHORT_TEXT);
    if (name) out.push({ name, slug: null });
  }
  return out.length > 0 ? out : null;
}

function sanitizeGalleryImages(value) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (const item of value.slice(0, MAX_GALLERY_IMAGES)) {
    if (item && typeof item === 'object') {
      const src = sanitizeUrl(item.src || item.url || item.image);
      if (!src) continue;
      out.push({
        src,
        alt: sanitizeString(item.alt, MAX_MEDIUM_TEXT),
        name: sanitizeString(item.name, MAX_SHORT_TEXT),
      });
      continue;
    }
    const src = sanitizeUrl(item);
    if (src) out.push({ src, alt: null, name: null });
  }
  return out.length > 0 ? out : null;
}

function sanitizeVariants(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value.slice(0, MAX_VARIANTS)) {
      if (!item || typeof item !== 'object') continue;
      const normalized = {
        id: sanitizeString(item.id || item.external_id || item.externalId, MAX_SHORT_TEXT),
        price: sanitizeNumeric(item.price),
        regular_price: sanitizeNumeric(item.regular_price),
        sale_price: sanitizeNumeric(item.sale_price),
        stock_status: sanitizeString(item.stock_status, MAX_SHORT_TEXT),
        stock_quantity: sanitizeInteger(item.stock_quantity),
        is_in_stock: sanitizeBoolean(item.is_in_stock != null ? item.is_in_stock : item.in_stock),
        attributes: sanitizeJson(item.attributes),
      };
      const hasAnyValue = Object.values(normalized).some((field) => field !== null && field !== '');
      if (hasAnyValue) out.push(normalized);
    }
    return out.length > 0 ? out : null;
  }
  if (typeof value === 'object') {
    return sanitizeJson(value);
  }
  return null;
}

function sanitizeSourceUpdatedAt(value) {
  if (value == null || value === '') return null;
  const timestamp = Date.parse(String(value));
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

function buildProductSyncRow(product, shopId) {
  if (!product || product.external_id == null) return null;

  const row = {
    shop_id: shopId,
    external_id: String(product.external_id),
    is_synced: true,
    last_synced_at: new Date().toISOString(),
  };

  if (hasOwn(product, 'name')) row.name = sanitizeString(product.name, MAX_SHORT_TEXT);
  if (hasOwn(product, 'category')) {
    const normalizedCategory = sanitizeString(product.category, MAX_SHORT_TEXT);
    row.category = normalizedCategory && ALLOWED_CATEGORIES.includes(normalizedCategory) ? normalizedCategory : null;
  }
  if (hasOwn(product, 'garment_image_url')) row.garment_image_url = sanitizeUrl(product.garment_image_url);
  if (hasOwn(product, 'product_url')) row.product_url = sanitizeUrl(product.product_url);
  if (hasOwn(product, 'variants')) row.variants = sanitizeVariants(product.variants);

  if (hasOwn(product, 'price')) row.price = sanitizeNumeric(product.price);
  if (hasOwn(product, 'regular_price')) row.regular_price = sanitizeNumeric(product.regular_price);
  if (hasOwn(product, 'sale_price')) row.sale_price = sanitizeNumeric(product.sale_price);
  if (hasOwn(product, 'currency')) row.currency = sanitizeString(product.currency, 16);
  if (hasOwn(product, 'stock_status')) row.stock_status = sanitizeString(product.stock_status, 40);
  if (hasOwn(product, 'stock_quantity')) row.stock_quantity = sanitizeInteger(product.stock_quantity);
  if (hasOwn(product, 'is_in_stock')) row.is_in_stock = sanitizeBoolean(product.is_in_stock);
  if (hasOwn(product, 'attributes')) row.attributes = sanitizeJson(product.attributes);
  if (hasOwn(product, 'colors')) row.colors = sanitizeStringList(product.colors, 80);
  if (hasOwn(product, 'sizes')) row.sizes = sanitizeStringList(product.sizes, 80);
  if (hasOwn(product, 'material')) row.material = sanitizeString(product.material, MAX_SHORT_TEXT);
  if (hasOwn(product, 'description')) row.description = sanitizeString(product.description, MAX_LONG_TEXT);
  if (hasOwn(product, 'short_description')) row.short_description = sanitizeString(product.short_description, MAX_MEDIUM_TEXT);
  if (hasOwn(product, 'tags')) row.tags = sanitizeTags(product.tags) || sanitizeJson(product.tags);
  if (hasOwn(product, 'gallery_images')) row.gallery_images = sanitizeGalleryImages(product.gallery_images);
  if (hasOwn(product, 'source_updated_at')) row.source_updated_at = sanitizeSourceUpdatedAt(product.source_updated_at);

  return row;
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
const passThroughAuth = (req, res, next) => next();
const advisorRouter = createAdvisorRouter({ authMiddleware: passThroughAuth });

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

// GET /api/widget/modules/:shopId  → effective module access for widget consumers.
router.get('/modules/:shopId', async (req, res) => {
  const { shopId } = req.params;
  if (!shopId) throw new ApiError(400, 'shopId path param is required');

  const snapshot = await getModuleAccessSnapshot({
    clientId: req.clientId,
    plan: req.client && req.client.plan,
    shopId,
  });

  res.json(snapshot);
});

// POST /api/widget/advisor/chat  → storefront-safe advisor chat bridge.
router.use('/advisor', (req, res, next) => {
  if (req.method !== 'POST' || req.path !== '/chat') {
    return next(new ApiError(404, `Not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
  }
  return next();
}, advisorRouter);

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
    .map((p) => buildProductSyncRow(p, shopId))
    .filter(Boolean);

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
