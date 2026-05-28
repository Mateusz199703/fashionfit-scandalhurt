const express = require('express');
const config = require('../config');
const { supabase } = require('../services/supabase');
const { syncShopProducts } = require('../services/woocommerce');
const { encryptFields, decryptMaybe } = require('../services/encryption');
const {
  isMockBackendEnabled,
  listMockShops,
  createMockShop,
  getMockShop,
  updateMockShop,
  deleteMockShop,
  syncMockShopProducts,
  getMockClientById,
} = require('../services/mockStore');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockBackend = isMockBackendEnabled();
router.use(authenticateJWT);

function sanitizeShop(shop) {
  if (!shop) return shop;
  const hasWooCredentials = Boolean(shop.wc_consumer_key && shop.wc_consumer_secret);
  const next = { ...shop, hasWooCredentials };
  delete next.wc_consumer_key;
  delete next.wc_consumer_secret;
  return next;
}

function encryptWooCredentials(payload) {
  const patch = { ...(payload || {}) };
  const sensitive = ['wc_consumer_key', 'wc_consumer_secret'];

  for (const field of sensitive) {
    if (!(field in patch)) continue;
    const value = patch[field];
    if (value === '' || value === null) {
      patch[field] = null;
      continue;
    }
    if (value !== undefined) {
      patch[field] = String(value).trim();
    }
  }

  return encryptFields(patch, sensitive);
}

function withDecryptedWooCredentials(shop) {
  if (!shop) return shop;
  try {
    let wcConsumerKey = shop.wc_consumer_key;
    let wcConsumerSecret = shop.wc_consumer_secret;

    if (wcConsumerKey) wcConsumerKey = decryptMaybe(wcConsumerKey);
    if (wcConsumerSecret) wcConsumerSecret = decryptMaybe(wcConsumerSecret);

    return {
      ...shop,
      wc_consumer_key: wcConsumerKey,
      wc_consumer_secret: wcConsumerSecret,
    };
  } catch (err) {
    throw new ApiError(500, `Could not decrypt WooCommerce credentials: ${err.message}`, 'CREDENTIALS_DECRYPT_FAILED');
  }
}

function isOnboardingTableMissing(err) {
  if (!err) return false;
  if (err.code === '42P01') return true;
  return /onboarding_progress/i.test(String(err.message || ''));
}

function markOnboardingProgressAsync(clientId, patch) {
  setImmediate(async () => {
    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert(
          {
            client_id: clientId,
            updated_at: new Date().toISOString(),
            ...patch,
          },
          { onConflict: 'client_id' },
        );
      if (error) throw error;
    } catch (err) {
      if (!isOnboardingTableMissing(err)) {
        console.warn('onboarding progress update failed:', err.message);
      }
    }
  });
}

function resolveWidgetScriptUrl(req) {
  const base = config.apiPublicUrl || `${req.protocol}://${req.get('host')}`;
  return `${String(base).replace(/\/+$/, '')}/widget.js`;
}

async function getOwnedShop(shopId, clientId) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Shop not found');
  return data;
}

// GET /api/shops
router.get('/', async (req, res) => {
  if (useMockBackend) {
    res.json({ shops: listMockShops(req.clientId).map(sanitizeShop) });
    return;
  }

  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('client_id', req.clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ shops: (data || []).map(sanitizeShop) });
});

// POST /api/shops
router.post('/', async (req, res) => {
  const { name, domain, platform, wc_consumer_key, wc_consumer_secret, widget_config } = req.body || {};
  if (!domain) throw new ApiError(400, 'domain is required');

  if (useMockBackend) {
    const shop = createMockShop(req.clientId, {
      name,
      domain,
      platform,
      wc_consumer_key,
      wc_consumer_secret,
      widget_config,
    });
    res.status(201).json({ shop: sanitizeShop(shop) });
    return;
  }

  const encrypted = encryptWooCredentials({
    wc_consumer_key: wc_consumer_key || null,
    wc_consumer_secret: wc_consumer_secret || null,
  });

  const { data, error } = await supabase
    .from('shops')
    .insert({
      client_id: req.clientId,
      name: name || null,
      domain,
      platform: platform || 'woocommerce',
      wc_consumer_key: encrypted.wc_consumer_key,
      wc_consumer_secret: encrypted.wc_consumer_secret,
      widget_config: widget_config || {},
    })
    .select('*')
    .single();
  if (error) throw error;
  markOnboardingProgressAsync(req.clientId, { step_shop_added: true });
  res.status(201).json({ shop: sanitizeShop(data) });
});

// PUT /api/shops/:id
router.put('/:id', async (req, res) => {
  if (useMockBackend) {
    const allowed = ['name', 'domain', 'platform', 'wc_consumer_key', 'wc_consumer_secret', 'widget_config', 'is_active'];
    const patch = {};
    for (const key of allowed) {
      if (req.body && key in req.body) patch[key] = req.body[key];
    }
    const shop = updateMockShop(req.params.id, req.clientId, patch);
    if (!shop) throw new ApiError(404, 'Shop not found');
    res.json({ shop: sanitizeShop(shop) });
    return;
  }

  await getOwnedShop(req.params.id, req.clientId);

  const allowed = ['name', 'domain', 'platform', 'wc_consumer_key', 'wc_consumer_secret', 'widget_config', 'is_active'];
  const patch = {};
  for (const key of allowed) {
    if (req.body && key in req.body) patch[key] = req.body[key];
  }
  const encryptedPatch = encryptWooCredentials(patch);

  const { data, error } = await supabase
    .from('shops')
    .update(encryptedPatch)
    .eq('id', req.params.id)
    .eq('client_id', req.clientId)
    .select('*')
    .single();
  if (error) throw error;
  res.json({ shop: sanitizeShop(data) });
});

// DELETE /api/shops/:id
router.delete('/:id', async (req, res) => {
  if (useMockBackend) {
    const ok = deleteMockShop(req.params.id, req.clientId);
    if (!ok) throw new ApiError(404, 'Shop not found');
    res.status(204).end();
    return;
  }

  await getOwnedShop(req.params.id, req.clientId);
  const { error } = await supabase
    .from('shops')
    .delete()
    .eq('id', req.params.id)
    .eq('client_id', req.clientId);
  if (error) throw error;
  res.status(204).end();
});

// GET /api/shops/:id/snippet → ready-to-paste embed snippet
router.get('/:id/snippet', async (req, res) => {
  let shop;
  let clientApiKey;
  if (useMockBackend) {
    shop = getMockShop(req.params.id, req.clientId);
    if (!shop) throw new ApiError(404, 'Shop not found');
    const client = getMockClientById(req.clientId);
    if (!client) throw new ApiError(404, 'Client not found');
    clientApiKey = client.api_key;
  } else {
    shop = await getOwnedShop(req.params.id, req.clientId);
    const { data: client, error } = await supabase
      .from('clients')
      .select('api_key')
      .eq('id', req.clientId)
      .single();
    if (error) throw error;
    clientApiKey = client.api_key;
  }

  const widgetUrl = resolveWidgetScriptUrl(req);
  const snippet = [
    '<!-- FashionFit Widget -->',
    '<script',
    `  src="${widgetUrl}"`,
    `  data-fashionfit-shop="${shop.id}"`,
    `  data-fashionfit-key="${clientApiKey}"`,
    '  async>',
    '</script>',
  ].join('\n');

  res.json({ snippet });
});

// GET /api/shops/:id/verify → check whether the widget/plugin is live
router.get('/:id/verify', async (req, res) => {
  if (useMockBackend) {
    const shop = getMockShop(req.params.id, req.clientId);
    if (!shop) throw new ApiError(404, 'Shop not found');
    res.json({
      connected: true,
      productCount: 0,
      lastEventAt: null,
    });
    return;
  }

  await getOwnedShop(req.params.id, req.clientId);

  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', req.params.id)
    .eq('is_synced', true);

  const { data: lastEvent } = await supabase
    .from('analytics_events')
    .select('created_at')
    .eq('shop_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  res.json({
    connected: (productCount || 0) > 0 || Boolean(lastEvent),
    productCount: productCount || 0,
    lastEventAt: lastEvent ? lastEvent.created_at : null,
  });
});

// POST /api/shops/:id/sync → pull products from WooCommerce into Supabase
router.post('/:id/sync', async (req, res) => {
  if (useMockBackend) {
    const result = syncMockShopProducts(req.params.id, req.clientId);
    if (!result) throw new ApiError(404, 'Shop not found');
    res.json(result);
    return;
  }

  const shop = withDecryptedWooCredentials(await getOwnedShop(req.params.id, req.clientId));
  if (!shop.wc_consumer_key || !shop.wc_consumer_secret) {
    throw new ApiError(400, 'Shop is missing WooCommerce API credentials');
  }
  const result = await syncShopProducts(shop);
  markOnboardingProgressAsync(req.clientId, { step_products_synced: true });
  res.json(result);
});

module.exports = router;
