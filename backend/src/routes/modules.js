const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const { getModuleAccessSnapshot } = require('../services/moduleAccess');

const router = express.Router();
router.use(authenticateJWT);

// GET /api/modules?shopId=...  → effective module access for a shop
router.get('/', async (req, res) => {
  const { shopId } = req.query || {};
  if (!shopId) throw new ApiError(400, 'shopId query param is required');

  const snapshot = await getModuleAccessSnapshot({
    clientId: req.clientId,
    plan: req.client && req.client.plan,
    shopId,
  });

  res.json(snapshot);
});

module.exports = router;
