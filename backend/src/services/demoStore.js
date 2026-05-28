const { v4: uuidv4 } = require('uuid');
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
    name: 'Sylwetka A',
    imageUrl: 'https://placehold.co/900x1200/f5f5f5/111111/png?text=Model+A',
  },
  {
    id: 'model-b',
    name: 'Sylwetka B',
    imageUrl: 'https://placehold.co/900x1200/f0f0f0/111111/png?text=Model+B',
  },
  {
    id: 'model-c',
    name: 'Sylwetka C',
    imageUrl: 'https://placehold.co/900x1200/ebebeb/111111/png?text=Model+C',
  },
];

const sessions = new Map();
const usageByDay = new Map();

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

function getProduct(productId) {
  return DEMO_PRODUCTS.find((p) => p.id === String(productId)) || null;
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
  const product = getProduct(productId);
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

function getDemoCatalog() {
  const usage = usageSnapshot();
  return {
    shopId: config.demo.shopId,
    products: DEMO_PRODUCTS,
    models: DEMO_MODELS,
    usage,
  };
}

module.exports = {
  validateDemoApiKey,
  getDemoCatalog,
  createTryon,
  getSession,
};
