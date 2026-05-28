const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const config = require('../config');
const fashn = require('./fashn');

const DEMO_PRODUCTS = [
  {
    id: 'demo-top-noir',
    name: 'Top Noir Atelier',
    category: 'tops',
    garmentImageUrl: 'https://placehold.co/1200x1600/f2f2f2/101010/png?text=Top+Noir+Atelier',
  },
  {
    id: 'demo-dress-ligne',
    name: 'Sukienka Ligne Blanche',
    category: 'one-pieces',
    garmentImageUrl: 'https://placehold.co/1200x1600/ededed/101010/png?text=Sukienka+Ligne+Blanche',
  },
  {
    id: 'demo-jacket-mono',
    name: 'Kurtka Monochrome',
    category: 'outerwear',
    garmentImageUrl: 'https://placehold.co/1200x1600/e9e9e9/101010/png?text=Kurtka+Monochrome',
  },
];

const DEMO_MODELS = [
  {
    id: 'model-a',
    name: 'Modelka Studio A',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'model-b',
    name: 'Modelka Studio B',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'model-c',
    name: 'Modelka Studio C',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  },
];

const sessions = new Map();
const usageByDay = new Map();
const CATALOG_TTL_MS = 15 * 60 * 1000;
const catalogState = {
  products: DEMO_PRODUCTS,
  source: 'fallback',
  updatedAtMs: 0,
};

function decodeHtmlEntities(input) {
  return String(input || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'');
}

function mapCategoryFromNames(categories) {
  const text = (categories || []).map((x) => String(x || '').toLowerCase()).join(' ');
  if (/(sukien|kombinezon|one)/.test(text)) return 'one-pieces';
  if (/(spodni|spodnie|spodnic|spodenki|short|bottom)/.test(text)) return 'bottoms';
  if (/(kurtk|plaszc|płaszcz|marynark|bluzy|outer)/.test(text)) return 'outerwear';
  return 'tops';
}

async function fetchRemoteDemoProducts() {
  const sourceUrl = String(config.demo.productsSourceUrl || '').trim();
  if (!sourceUrl) return null;

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'FashionFit-Demo/1.0',
    },
  });
  if (!response.ok) {
    throw new Error(`Remote demo products source failed (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) return null;

  const products = data
    .map((item, index) => {
      const images = Array.isArray(item.images) ? item.images : [];
      const firstImage = images[0] && images[0].src ? String(images[0].src) : null;
      if (!firstImage) return null;

      const categories = Array.isArray(item.categories)
        ? item.categories.map((cat) => decodeHtmlEntities(cat && cat.name ? cat.name : '')).filter(Boolean)
        : [];

      return {
        id: item.id ? `wc-${item.id}` : `wc-fallback-${index + 1}`,
        name: decodeHtmlEntities(item.name || `Produkt ${index + 1}`),
        category: mapCategoryFromNames(categories),
        garmentImageUrl: firstImage,
        productUrl: item.permalink || null,
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  return products.length >= 3 ? products : null;
}

async function ensureDemoProducts() {
  const now = Date.now();
  if (catalogState.updatedAtMs && now - catalogState.updatedAtMs < CATALOG_TTL_MS) {
    return catalogState.products;
  }

  try {
    const remoteProducts = await fetchRemoteDemoProducts();
    if (remoteProducts && remoteProducts.length) {
      catalogState.products = remoteProducts;
      catalogState.source = 'remote';
      catalogState.updatedAtMs = now;
      return catalogState.products;
    }
  } catch (err) {
    console.warn('demo products fetch failed:', err.message);
  }

  catalogState.products = DEMO_PRODUCTS;
  catalogState.source = 'fallback';
  catalogState.updatedAtMs = now;
  return catalogState.products;
}

function currentDayKey() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function usageSnapshot() {
  const key = currentDayKey();
  const used = usageByDay.get(key) || 0;
  const limit = Math.max(1, Number(config.demo.dailyLimit || 500));
  return {
    dayKey: key,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

function consumeUsage() {
  const snap = usageSnapshot();
  if (snap.used >= snap.limit) return { allowed: false, ...snap };
  usageByDay.set(snap.dayKey, snap.used + 1);
  const next = usageSnapshot();
  return { allowed: true, ...next };
}

async function getProduct(productId) {
  const products = await ensureDemoProducts();
  return products.find((p) => p.id === String(productId)) || null;
}

function getModel(modelId) {
  return DEMO_MODELS.find((m) => m.id === String(modelId)) || null;
}

function toPublicSession(session) {
  return {
    sessionId: session.id,
    status: session.status,
    resultImageUrl: session.resultImageUrl || null,
    error: session.error || null,
    createdAt: session.createdAt,
  };
}

async function createTryon({ productId, modelId }) {
  const product = await getProduct(productId);
  if (!product) {
    const err = new Error('Nie znaleziono produktu demo');
    err.code = 'DEMO_PRODUCT_NOT_FOUND';
    throw err;
  }

  const model = getModel(modelId);
  if (!model) {
    const err = new Error('Nie znaleziono modelki demo');
    err.code = 'DEMO_MODEL_NOT_FOUND';
    throw err;
  }

  const usage = consumeUsage();
  if (!usage.allowed) {
    const err = new Error('Limit demo na dziś został wyczerpany');
    err.code = 'DEMO_DAILY_LIMIT_REACHED';
    err.meta = usage;
    throw err;
  }

  const id = `demo_${uuidv4()}`;
  const session = {
    id,
    status: 'processing',
    createdAt: new Date().toISOString(),
    resultImageUrl: null,
    error: null,
  };
  sessions.set(id, session);

  if (!config.fashn.apiKey) {
    session.status = 'completed';
    session.resultImageUrl = `https://placehold.co/900x1200/111111/ffffff/png?text=Demo+Try-On+${encodeURIComponent(product.name)}`;
    return { session: toPublicSession(session), usage };
  }

  (async () => {
    try {
      const predictionId = await fashn.run({
        modelImage: model.imageUrl,
        garmentImage: product.garmentImageUrl,
        category: product.category,
      });
      const result = await fashn.pollUntilComplete(predictionId);
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      session.status = 'completed';
      session.resultImageUrl = outputUrl || null;
    } catch (err) {
      session.status = 'failed';
      session.error = err.message || 'Try-on demo failed';
    }
  })();

  return { session: toPublicSession(session), usage };
}

function getSession(sessionId) {
  const session = sessions.get(String(sessionId));
  return session ? toPublicSession(session) : null;
}

function validateDemoApiKey(candidate) {
  return String(candidate || '').trim() === String(config.demo.apiKey || '').trim();
}

async function getDemoCatalog() {
  const products = await ensureDemoProducts();
  const usage = usageSnapshot();
  return {
    shopId: config.demo.shopId,
    products,
    models: DEMO_MODELS,
    usage,
    source: catalogState.source,
    engine: config.fashn.apiKey ? 'fashn' : 'mock',
  };
}

module.exports = {
  validateDemoApiKey,
  getDemoCatalog,
  createTryon,
  getSession,
};
