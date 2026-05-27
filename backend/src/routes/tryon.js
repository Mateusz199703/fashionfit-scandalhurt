const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { supabase, uploadBase64Image, uploadImageFromUrl } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const fashn = require('../services/fashn');
const { ApiError } = require('../middleware/errorHandler');

// Mounted under /api/widget/tryon — API key auth is applied by the parent router.
const router = express.Router();

// POST /api/widget/tryon/photo
router.post('/photo', async (req, res) => {
  const { shopId, productId, personImageBase64, metadata } = req.body || {};
  if (!shopId || !productId || !personImageBase64) {
    throw new ApiError(400, 'shopId, productId and personImageBase64 are required');
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

  const sessionToken = uuidv4();
  const personUrl = await uploadBase64Image(
    config.storage.uploadsBucket,
    `${shopId}/${sessionToken}.jpg`,
    personImageBase64,
  );

  const predictionId = await fashn.run({
    modelImage: personUrl,
    garmentImage: product.garment_image_url,
    category: product.category,
  });

  const { data: session, error } = await supabase
    .from('tryon_sessions')
    .insert({
      shop_id: shopId,
      product_id: productId,
      session_token: sessionToken,
      mode: 'photo',
      status: 'processing',
      person_image_url: personUrl,
      fashn_prediction_id: predictionId,
      metadata: metadata || null,
    })
    .select('id')
    .single();
  if (error) throw error;

  res.status(202).json({ sessionId: session.id, status: 'processing' });
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
    return res.json({ status: 'completed', resultImageUrl: session.result_image_url });
  }
  if (session.status === 'failed') {
    return res.json({ status: 'failed', resultImageUrl: null });
  }
  if (!session.fashn_prediction_id) {
    return res.json({ status: session.status, resultImageUrl: null });
  }

  const prediction = await fashn.getStatus(session.fashn_prediction_id);

  if (prediction.status === 'completed') {
    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    const storedUrl = await uploadImageFromUrl(
      config.storage.resultsBucket,
      `${session.shop_id}/${session.id}.jpg`,
      outputUrl,
    );
    await supabase
      .from('tryon_sessions')
      .update({
        status: 'completed',
        result_image_url: storedUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);
    return res.json({ status: 'completed', resultImageUrl: storedUrl });
  }

  if (prediction.status === 'failed') {
    await supabase.from('tryon_sessions').update({ status: 'failed' }).eq('id', session.id);
    return res.json({ status: 'failed', resultImageUrl: null });
  }

  return res.json({ status: 'processing', resultImageUrl: null });
});

module.exports = router;
