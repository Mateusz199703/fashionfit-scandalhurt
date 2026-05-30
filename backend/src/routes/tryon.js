const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { supabase } = require('../services/supabase');
const {
  uploadBase64,
  uploadFromUrl,
  createSignedUrl,
  isRemoteUrl,
} = require('../services/storage');
const { get: getIdempotencyEntry, set: setIdempotencyEntry } = require('../services/idempotencyStore');
const { isShopOwnedByClient } = require('../services/ownership');
const { checkUsageQuota } = require('../middleware/usageCheck');
const tryonWorker = require('../services/tryonWorker');
const fashn = require('../services/fashn');
const { ALLOWED_PROVIDERS, normalizeProvider } = require('../services/tryonProviderRouter');
const { ApiError } = require('../middleware/errorHandler');

// Mounted under /api/widget/tryon — API key auth is applied by the parent router.
const router = express.Router();

function personStoragePath(shopId, sessionToken) {
  return `${shopId}/${sessionToken}.jpg`;
}

async function resolveResultImageUrl(storedValue) {
  if (!storedValue) return null;
  if (isRemoteUrl(storedValue)) return storedValue;
  return createSignedUrl(config.storage.resultsBucket, storedValue, 60 * 60);
}

function getIdempotencyKey(req) {
  const fromHeader = req.headers['idempotency-key'];
  const fromBody = req.body && req.body.idempotencyKey;
  const key = fromHeader || fromBody || null;
  if (!key) return null;
  return String(key).trim().slice(0, 120);
}

function validatePersonImageBase64(payload) {
  const raw = String(payload || '').includes(',') ? String(payload).split(',').pop() : String(payload || '');
  if (!raw) throw new ApiError(400, 'personImageBase64 is empty');
  const approxBytes = Math.floor((raw.length * 3) / 4);
  const maxBytes = 10 * 1024 * 1024;
  if (approxBytes > maxBytes) {
    throw new ApiError(413, 'Image is too large. Max 10MB.', 'IMAGE_TOO_LARGE');
  }
}

async function fetchSessionById(sessionId) {
  const { data, error } = await supabase
    .from('tryon_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// POST /api/widget/tryon/photo
router.post('/photo', checkUsageQuota, async (req, res) => {
  const {
    shopId,
    productId,
    personImageBase64,
    metadata,
    preferredProvider: preferredProviderInput,
  } = req.body || {};
  if (!shopId || !productId || !personImageBase64) {
    throw new ApiError(400, 'shopId, productId and personImageBase64 are required');
  }
  validatePersonImageBase64(personImageBase64);
  const preferredProvider = normalizeProvider(preferredProviderInput || (metadata && metadata.preferredProvider) || 'auto');
  if (!ALLOWED_PROVIDERS.includes(preferredProvider)) {
    throw new ApiError(400, `Unsupported preferredProvider. Allowed: ${ALLOWED_PROVIDERS.join(', ')}`);
  }

  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const existing = getIdempotencyEntry({
      clientId: req.clientId,
      shopId,
      idempotencyKey,
    });
    if (existing && existing.sessionId) {
      const session = await fetchSessionById(existing.sessionId);
      if (session) {
        if (!(await isShopOwnedByClient(session.shop_id, req.clientId))) {
          throw new ApiError(403, 'Session does not belong to this API key');
        }
        if (session.status === 'completed') {
          return res.status(202).json({
            sessionId: session.id,
            status: 'completed',
            resultImageUrl: await resolveResultImageUrl(session.result_image_url),
          });
        }
        return res.status(202).json({ sessionId: session.id, status: session.status || 'pending' });
      }
    }
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(403, 'Shop does not belong to this API key');
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, garment_image_url, category')
    .eq('id', productId)
    .eq('shop_id', shopId)
    .maybeSingle();
  if (productError) throw productError;
  if (!product) throw new ApiError(404, 'Product not found for this shop');
  if (!product.garment_image_url) throw new ApiError(422, 'Product has no garment image to try on');
  if (String(product.category || '').toLowerCase() === 'accessories') {
    throw new ApiError(
      422,
      'Try-on supports only clothing categories (tops, bottoms, one-pieces, outerwear). Accessories are not supported.',
      'CATEGORY_NOT_SUPPORTED',
    );
  }

  const sessionToken = uuidv4();
  const normalizedMetadata = {
    ...(metadata || {}),
    output_quality: 'max',
    processing_preset: 'premium_max',
  };
  const personKey = await uploadBase64(
    config.storage.uploadsBucket,
    personStoragePath(shopId, sessionToken),
    personImageBase64,
  );

  const { data: session, error } = await supabase
    .from('tryon_sessions')
    .insert({
      shop_id: shopId,
      product_id: productId,
      session_token: sessionToken,
      mode: 'photo',
      status: 'pending',
      person_image_url: personKey,
      metadata: {
        ...normalizedMetadata,
        preferredProvider,
        ...(idempotencyKey ? { idempotencyKey } : {}),
        processing_mode: 'background_queue',
      },
    })
    .select('id')
    .single();
  if (error) throw error;

  tryonWorker.enqueue(session.id);

  if (idempotencyKey) {
    setIdempotencyEntry({
      clientId: req.clientId,
      shopId,
      idempotencyKey,
      sessionId: session.id,
    });
  }

  res.status(202).json({ sessionId: session.id, status: 'pending' });
});

// GET /api/widget/tryon/status/:sessionId
router.get('/status/:sessionId', async (req, res) => {
  const { data: session, error } = await supabase
    .from('tryon_sessions')
    .select('*')
    .eq('id', req.params.sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!session) throw new ApiError(404, 'Session not found');
  if (!(await isShopOwnedByClient(session.shop_id, req.clientId))) {
    throw new ApiError(403, 'Session does not belong to this API key');
  }

  if (session.status === 'completed') {
    return res.json({
      status: 'completed',
      resultImageUrl: await resolveResultImageUrl(session.result_image_url),
    });
  }
  if (session.status === 'failed') {
    return res.json({ status: 'failed', resultImageUrl: null });
  }
  if (session.status === 'pending' || session.status === 'processing') {
    if (!session.fashn_prediction_id) {
      return res.json({ status: session.status, resultImageUrl: null });
    }

    // Backward compatibility for old sessions created before background queue.
    const prediction = await fashn.getStatus(session.fashn_prediction_id);

    if (prediction.status === 'completed') {
      const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      const storedPath = await uploadFromUrl(
        config.storage.resultsBucket,
        `${session.shop_id}/${session.id}.jpg`,
        outputUrl,
      );
      await supabase
        .from('tryon_sessions')
        .update({
          status: 'completed',
          result_image_url: storedPath,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      return res.json({
        status: 'completed',
        resultImageUrl: await createSignedUrl(config.storage.resultsBucket, storedPath, 60 * 60),
      });
    }

    if (prediction.status === 'failed') {
      await supabase.from('tryon_sessions').update({ status: 'failed' }).eq('id', session.id);
      return res.json({ status: 'failed', resultImageUrl: null });
    }

    return res.json({ status: session.status, resultImageUrl: null });
  }
  return res.json({ status: session.status || 'pending', resultImageUrl: null });
});

module.exports = router;
