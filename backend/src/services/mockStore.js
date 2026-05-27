const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const clientsByEmail = new Map();
const clientsById = new Map();
const shopsById = new Map();
const productsByShopId = new Map();
const analyticsByShopId = new Map();
const dbFile = path.resolve(__dirname, '../../.mock-db.json');

const useMockBackend = config.env !== 'production'
  && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY);

function isMockBackendEnabled() {
  return useMockBackend;
}

function serializeState() {
  return {
    clients: [...clientsById.values()],
    shops: [...shopsById.values()],
    productsByShopId: Object.fromEntries(productsByShopId.entries()),
    analyticsByShopId: Object.fromEntries(analyticsByShopId.entries()),
  };
}

function saveState() {
  if (!useMockBackend) return;
  fs.writeFileSync(dbFile, JSON.stringify(serializeState(), null, 2), 'utf8');
}

function loadState() {
  if (!useMockBackend) return;
  if (!fs.existsSync(dbFile)) return;
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    if (!raw.trim()) return;
    const data = JSON.parse(raw);

    for (const client of data.clients || []) {
      clientsById.set(client.id, client);
      clientsByEmail.set(client.email, client);
    }
    for (const shop of data.shops || []) {
      shopsById.set(shop.id, shop);
    }
    for (const [shopId, products] of Object.entries(data.productsByShopId || {})) {
      productsByShopId.set(shopId, products);
    }
    for (const [shopId, stats] of Object.entries(data.analyticsByShopId || {})) {
      analyticsByShopId.set(shopId, stats);
    }
  } catch (err) {
    console.warn('Could not load mock db file:', err.message);
  }
}

function createMockClient({ email, name, company_name, passwordHash }) {
  const client = {
    id: uuidv4(),
    email,
    name,
    company_name: company_name || null,
    password_hash: passwordHash,
    plan: 'STARTER',
    status: 'trial',
    api_key: `ff_mock_${uuidv4().replace(/-/g, '').slice(0, 24)}`,
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    stripe_customer_id: null,
  };

  clientsByEmail.set(client.email, client);
  clientsById.set(client.id, client);
  saveState();
  return client;
}

function getMockClientByEmail(email) {
  return clientsByEmail.get(email) || null;
}

function getMockClientById(clientId) {
  return clientsById.get(clientId) || null;
}

function getMockClientByApiKey(apiKey) {
  if (!apiKey) return null;
  for (const client of clientsById.values()) {
    if (client.api_key === apiKey) return client;
  }
  return null;
}

function hasMockClients() {
  return clientsById.size > 0;
}

function normalizeDomain(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

function listMockShops(clientId) {
  return [...shopsById.values()]
    .filter((shop) => shop.client_id === clientId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

function findMockShopForDomain(clientId, domain) {
  const shops = listMockShops(clientId);
  if (shops.length === 0) return null;
  const wanted = normalizeDomain(domain);
  let shop = wanted ? shops.find((s) => normalizeDomain(s.domain) === wanted) : null;
  if (!shop && shops.length === 1) [shop] = shops;
  return shop || null;
}

function createMockShop(clientId, input) {
  const now = new Date().toISOString();
  const shop = {
    id: uuidv4(),
    client_id: clientId,
    name: input.name || null,
    domain: input.domain,
    platform: input.platform || 'woocommerce',
    wc_consumer_key: input.wc_consumer_key || null,
    wc_consumer_secret: input.wc_consumer_secret || null,
    widget_config: input.widget_config || {},
    is_active: true,
    created_at: now,
  };

  shopsById.set(shop.id, shop);
  productsByShopId.set(shop.id, []);
  analyticsByShopId.set(shop.id, {
    widget_opens: 0,
    tryon_starts: 0,
    completions: 0,
    add_to_carts: 0,
    purchases: 0,
    buyers_count: 0,
    revenue: 0,
  });
  saveState();
  return shop;
}

function getMockShop(shopId, clientId) {
  const shop = shopsById.get(shopId);
  if (!shop || shop.client_id !== clientId) return null;
  return shop;
}

function updateMockShop(shopId, clientId, patch) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return null;
  const next = { ...shop, ...patch };
  shopsById.set(shopId, next);
  saveState();
  return next;
}

function deleteMockShop(shopId, clientId) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return false;
  shopsById.delete(shopId);
  productsByShopId.delete(shopId);
  analyticsByShopId.delete(shopId);
  saveState();
  return true;
}

function listMockProducts(shopId, clientId) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return null;
  return productsByShopId.get(shopId) || [];
}

function upsertMockWidgetProducts(shopId, clientId, products) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return null;

  const now = new Date().toISOString();
  const existing = productsByShopId.get(shopId) || [];
  const byExternalId = new Map(existing.map((p) => [String(p.external_id), p]));

  let synced = 0;
  for (const product of products || []) {
    if (!product || product.external_id == null) continue;
    const externalId = String(product.external_id);
    const prev = byExternalId.get(externalId);
    byExternalId.set(externalId, {
      id: prev ? prev.id : uuidv4(),
      shop_id: shopId,
      external_id: externalId,
      name: product.name || (prev ? prev.name : null),
      category: product.category || (prev ? prev.category : 'tops'),
      garment_image_url: product.garment_image_url || (prev ? prev.garment_image_url : null),
      product_url: product.product_url || (prev ? prev.product_url : null),
      variants: product.variants || (prev ? prev.variants : null),
      is_synced: true,
      last_synced_at: now,
      created_at: prev ? prev.created_at : now,
    });
    synced += 1;
  }

  productsByShopId.set(shopId, [...byExternalId.values()]);
  saveState();
  return synced;
}

function deactivateMockWidgetProduct(shopId, clientId, externalId) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return false;
  const list = productsByShopId.get(shopId) || [];
  let changed = false;
  const next = list.map((item) => {
    if (String(item.external_id) === String(externalId)) {
      changed = true;
      return { ...item, is_synced: false };
    }
    return item;
  });
  productsByShopId.set(shopId, next);
  saveState();
  return changed;
}

function trackMockAnalyticsEvent(shopId, clientId, eventType) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return false;

  const stats = analyticsByShopId.get(shopId) || {
    widget_opens: 0,
    tryon_starts: 0,
    completions: 0,
    add_to_carts: 0,
    purchases: 0,
    buyers_count: 0,
    revenue: 0,
  };

  if (eventType === 'widget_open') stats.widget_opens += 1;
  if (eventType === 'tryon_start') stats.tryon_starts += 1;
  if (eventType === 'tryon_complete') stats.completions += 1;
  if (eventType === 'add_to_cart') stats.add_to_carts += 1;
  if (eventType === 'purchase') stats.purchases += 1;

  analyticsByShopId.set(shopId, stats);
  saveState();
  return true;
}

function syncMockShopProducts(shopId, clientId) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return null;

  const now = new Date().toISOString();
  const products = [
    { name: 'Sukienka Luna', category: 'one-pieces' },
    { name: 'Marynarka Nova', category: 'outerwear' },
    { name: 'Jeansy Skyline', category: 'bottoms' },
    { name: 'Bluzka Bloom', category: 'tops' },
  ].map((item, idx) => ({
    id: uuidv4(),
    shop_id: shopId,
    external_id: `mock-${idx + 1}`,
    name: item.name,
    category: item.category,
    garment_image_url: null,
    product_url: `https://${shop.domain}/products/mock-${idx + 1}`,
    is_synced: true,
    last_synced_at: now,
    created_at: now,
  }));

  productsByShopId.set(shopId, products);
  analyticsByShopId.set(shopId, {
    widget_opens: 180,
    tryon_starts: 120,
    completions: 84,
    add_to_carts: 26,
    purchases: 14,
    buyers_count: 11,
    revenue: 4380,
  });
  saveState();

  return { synced: products.length };
}

function getMockAnalyticsOverview(shopId, clientId, period) {
  const shop = getMockShop(shopId, clientId);
  if (!shop) return null;
  const base = analyticsByShopId.get(shopId) || {
    widget_opens: 0,
    tryon_starts: 0,
    completions: 0,
    add_to_carts: 0,
    purchases: 0,
    buyers_count: 0,
    revenue: 0,
  };

  const conversionRate = base.completions > 0
    ? Number((base.add_to_carts / base.completions).toFixed(4))
    : 0;
  const purchaseRate = base.completions > 0
    ? Number(((base.purchases || 0) / base.completions).toFixed(4))
    : 0;

  return {
    period,
    widget_opens: base.widget_opens,
    tryon_starts: base.tryon_starts,
    completions: base.completions,
    add_to_carts: base.add_to_carts,
    purchases: base.purchases || 0,
    conversion_rate: conversionRate,
    purchase_rate: purchaseRate,
    buyers_count: base.buyers_count || base.purchases || 0,
    revenue: base.revenue || 0,
    mode_split: { photo: Math.round(base.tryon_starts * 0.7), live_ar: Math.round(base.tryon_starts * 0.3) },
    top_products: [],
    daily_chart_data: [],
  };
}

function getMockBillingOverview(clientId) {
  const client = getMockClientById(clientId);
  if (!client) return null;

  const shops = listMockShops(clientId);
  let used = 0;
  for (const shop of shops) {
    const stats = analyticsByShopId.get(shop.id);
    used += stats ? stats.completions : 0;
  }

  return {
    plan: client.plan,
    status: client.status,
    trialEndsAt: client.trial_ends_at,
    periodStart: null,
    periodEnd: null,
    usage: {
      used,
      limit: config.planLimits[client.plan] || 0,
    },
  };
}

module.exports = {
  isMockBackendEnabled,
  hasMockClients,
  createMockClient,
  getMockClientByEmail,
  getMockClientById,
  getMockClientByApiKey,
  findMockShopForDomain,
  listMockShops,
  createMockShop,
  getMockShop,
  updateMockShop,
  deleteMockShop,
  listMockProducts,
  upsertMockWidgetProducts,
  deactivateMockWidgetProduct,
  trackMockAnalyticsEvent,
  syncMockShopProducts,
  getMockAnalyticsOverview,
  getMockBillingOverview,
};

loadState();
