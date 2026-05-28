const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { getOnboardingProgress } = require('../services/onboarding');

const router = express.Router();
router.use(authenticateJWT);

// GET /api/onboarding/progress
router.get('/progress', async (req, res) => {
  const progress = await getOnboardingProgress(req.clientId);
  res.json(progress);
});

module.exports = router;
