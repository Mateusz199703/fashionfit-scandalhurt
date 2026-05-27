const express = require('express');
const { supabase } = require('../services/supabase');
const { isShopOwnedByClient } = require('../services/ownership');
const { isMockBackendEnabled, listMockProducts } = require('../services/mockStore');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockBackend = isMockBackendEnabled();
router.use(authenticateJWT);

// GET /api/products?shopId=...  → list a shop's synced products (dashboard)
router.get('/', async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) throw new ApiError(400, 'shopId query param is required');

  if (useMockBackend) {
    const products = listMockProducts(shopId, req.clientId);
    if (!products) throw new ApiError(404, 'Shop not found');
    res.json({ products });
    return;
  }

  if (!(await isShopOwnedByClient(shopId, req.clientId))) {
    throw new ApiError(404, 'Shop not found');
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ products: data });
});

module.exports = router;
