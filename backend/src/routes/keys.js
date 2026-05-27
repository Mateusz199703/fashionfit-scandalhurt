const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
} = require('../services/apiKeys');

const router = express.Router();
router.use(authenticateJWT);

router.get('/', async (req, res) => {
  const keys = await listApiKeys(req.clientId);
  res.json({ keys });
});

router.post('/', async (req, res) => {
  const { name, scopes, expiresAt } = req.body || {};
  const result = await generateApiKey(req.clientId, { name, scopes, expiresAt });
  res.status(201).json({ key: result.key, rawKey: result.rawKey });
});

router.post('/:id/rotate', async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'Key id is required');
  const { name, scopes, expiresAt } = req.body || {};
  const result = await rotateApiKey(id, req.clientId, { name, scopes, expiresAt });
  res.json({ key: result.key, rawKey: result.rawKey });
});

router.post('/:id/revoke', async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'Key id is required');
  await revokeApiKey(id, req.clientId, req.body ? req.body.reason : null);
  res.status(204).end();
});

module.exports = router;
