const express = require('express');
const config = require('../config');
const { ApiError } = require('../middleware/errorHandler');
const {
  validateDemoApiKey,
  getDemoCatalog,
  createTryon,
  getSession,
} = require('../services/demoStore');

const router = express.Router();

function extractApiKey(req) {
  return req.headers['x-api-key'] || req.query.apiKey || (req.body && req.body.apiKey) || '';
}

function assertAuthorized(req) {
  if (!validateDemoApiKey(extractApiKey(req))) {
    throw new ApiError(401, 'Invalid demo API key', 'DEMO_KEY_INVALID');
  }
}

// GET /api/demo/catalog
router.get('/catalog', (req, res) => {
  const catalog = getDemoCatalog();
  res.json({
    shopId: catalog.shopId,
    usage: catalog.usage,
    products: catalog.products,
    models: catalog.models,
    // Public frontend can read this key to run the guided demo flow only.
    demoApiKey: config.demo.apiKey,
  });
});

// POST /api/demo/tryon/photo
router.post('/tryon/photo', async (req, res) => {
  assertAuthorized(req);
  const { shopId, productId, modelId } = req.body || {};
  if (!shopId || !productId || !modelId) {
    throw new ApiError(400, 'shopId, productId and modelId are required');
  }
  if (String(shopId) !== String(config.demo.shopId)) {
    throw new ApiError(403, 'Unknown demo shop', 'DEMO_SHOP_INVALID');
  }

  try {
    const { session, usage } = await createTryon({ productId, modelId });
    res.status(202).json({
      sessionId: session.sessionId,
      status: session.status,
      usage,
    });
  } catch (err) {
    if (err.code === 'DEMO_DAILY_LIMIT_REACHED') {
      throw new ApiError(429, 'Demo limit reached for today. Try again tomorrow.', 'DEMO_DAILY_LIMIT_REACHED', err.meta);
    }
    if (err.code === 'DEMO_PRODUCT_NOT_FOUND' || err.code === 'DEMO_MODEL_NOT_FOUND') {
      throw new ApiError(404, err.message, err.code);
    }
    throw err;
  }
});

// GET /api/demo/tryon/status/:sessionId
router.get('/tryon/status/:sessionId', (req, res) => {
  assertAuthorized(req);
  const session = getSession(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Demo session not found', 'DEMO_SESSION_NOT_FOUND');
  res.json({
    status: session.status,
    resultImageUrl: session.resultImageUrl,
    error: session.error,
  });
});

module.exports = router;
