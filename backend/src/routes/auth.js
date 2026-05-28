const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { supabase } = require('../services/supabase');
const { generateApiKey } = require('../services/apiKeys');
const stripeService = require('../services/stripe');
const {
  isMockBackendEnabled,
  hasMockClients,
  createMockClient,
  getMockClientByEmail,
  getMockClientById,
} = require('../services/mockStore');
const {
  registerRefreshToken,
  isRefreshTokenAllowed,
  revokeRefreshToken,
  isRefreshTokenRevoked,
  registerLoginFailure,
  clearLoginFailures,
  getLockoutState,
  createPasswordResetToken,
  consumePasswordResetToken,
} = require('../services/sessionStore');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockAuth = isMockBackendEnabled();
const BCRYPT_ROUNDS = 12;

function isTableMissingError(err, tableName) {
  if (!err) return false;
  if (err.code === '42P01') return true;
  return String(err.message || '').toLowerCase().includes(String(tableName || '').toLowerCase());
}

async function seedOnboardingProgress(clientId) {
  try {
    const { error } = await supabase
      .from('onboarding_progress')
      .upsert(
        {
          client_id: clientId,
          step_account_created: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id' },
      );
    if (error) throw error;
  } catch (err) {
    if (isTableMissingError(err, 'onboarding_progress')) {
      console.warn('onboarding_progress table missing, skipping seed');
      return;
    }
    throw err;
  }
}

function signAccessToken(client) {
  return jwt.sign({ sub: client.id, email: client.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function signRefreshToken(client) {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: client.id, email: client.email, type: 'refresh', jti },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn },
  );
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    registerRefreshToken(jti, client.id, decoded.exp);
  }
  return token;
}

function issueAuthTokens(client) {
  return {
    token: signAccessToken(client),
    refreshToken: signRefreshToken(client),
  };
}

function toClientResponse(client) {
  return {
    id: client.id,
    email: client.email,
    name: client.name,
    companyName: client.company_name || null,
    companyNip: client.company_nip || null,
    plan: client.plan,
    status: client.status,
    trialEndsAt: client.trial_ends_at || null,
  };
}

function normalizeNip(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits || null;
}

function assertPasswordStrength(password) {
  if (!password || String(password).length < 8) {
    throw new ApiError(400, 'Password must have at least 8 characters', 'WEAK_PASSWORD');
  }
}

function isValidPolishNip(nip) {
  if (!/^\d{10}$/.test(nip)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(nip[i]) * weights[i];
  const checksum = sum % 11;
  return checksum !== 10 && checksum === Number(nip[9]);
}

// POST /api/auth/register → create client, return JWT + api_key
router.post('/register', authLimiter, async (req, res) => {
  const {
    email,
    password,
    name,
    company_name,
    company_nip,
    plan,
    shop_domain,
  } = req.body || {};
  if (!email || !password || !name) {
    throw new ApiError(400, 'email, password and name are required');
  }
  assertPasswordStrength(password);
  const normalizedNip = normalizeNip(company_nip);
  if (normalizedNip && !isValidPolishNip(normalizedNip)) {
    throw new ApiError(400, 'Invalid NIP format');
  }
  const selectedPlan = plan ? String(plan).toUpperCase() : null;
  if (selectedPlan && !config.planLimits[selectedPlan]) {
    throw new ApiError(400, 'Unsupported plan');
  }

  if (useMockAuth) {
    const existing = getMockClientByEmail(email);
    if (existing) throw new ApiError(409, 'A client with this email already exists');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const client = createMockClient({
      email,
      name,
      company_name,
      company_nip: normalizedNip,
      passwordHash,
    });

    const checkoutUrl = selectedPlan
      ? `${config.frontendUrl}/billing?status=success&plan=${selectedPlan.toLowerCase()}`
      : null;

    const auth = issueAuthTokens(client);
    res.status(201).json({
      token: auth.token,
      refreshToken: auth.refreshToken,
      apiKey: client.api_key,
      client: toClientResponse(client),
      checkoutUrl,
    });
    return;
  }

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) throw new ApiError(409, 'A client with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create a Stripe customer up-front; non-fatal if billing isn't configured.
  let stripeCustomerId = null;
  try {
    const customer = await stripeService.createCustomer({
      email,
      name,
      companyNip: normalizedNip,
    });
    stripeCustomerId = customer.id;
  } catch (e) {
    console.warn('Stripe customer creation skipped:', e.message);
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      email,
      name,
      company_name: company_name || null,
      company_nip: normalizedNip,
      password_hash: passwordHash,
      stripe_customer_id: stripeCustomerId,
    })
    .select('id, email, name, company_name, company_nip, plan, status, api_key, trial_ends_at')
    .single();
  if (error) throw error;

  let issuedApiKey = data.api_key;
  await seedOnboardingProgress(data.id);
  try {
    const generated = await generateApiKey(data.id, {
      name: 'Default key',
      scopes: ['widget', 'sync'],
    });

    // Transitional compatibility for existing plugin/dashboard flows that still
    // read clients.api_key directly. New verification uses hashed api_keys table.
    const { error: keyUpdateError } = await supabase
      .from('clients')
      .update({ api_key: generated.rawKey })
      .eq('id', data.id);
    if (keyUpdateError) throw keyUpdateError;
    issuedApiKey = generated.rawKey;
  } catch (err) {
    if (!isTableMissingError(err, 'api_keys')) throw err;
    console.warn('api_keys table missing, using legacy clients.api_key fallback');
  }

  let checkoutUrl = null;
  if (selectedPlan && stripeService.isStripeSecretConfigured()) {
    const priceId = config.stripe.prices[selectedPlan];
    if (!priceId) throw new ApiError(400, `Plan ${selectedPlan} is not available for checkout`);

    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer({
        email,
        name,
        companyNip: normalizedNip,
      });
      stripeCustomerId = customer.id;
      await supabase.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', data.id);
    }

    const checkout = await stripeService.createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      plan: selectedPlan,
      clientId: data.id,
      shopDomain: shop_domain || null,
      source: 'register',
    });
    checkoutUrl = checkout.url;
  }

  const auth = issueAuthTokens(data);
  res.status(201).json({
    token: auth.token,
    refreshToken: auth.refreshToken,
    apiKey: issuedApiKey,
    checkoutUrl,
    client: {
      id: data.id,
      email: data.email,
      name: data.name,
      companyName: data.company_name,
      companyNip: data.company_nip,
      plan: data.plan,
      status: data.status,
      trialEndsAt: data.trial_ends_at,
    },
  });
});

// POST /api/auth/login → return JWT
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'email and password are required');
  const lock = getLockoutState(email);
  if (lock.locked) {
    throw new ApiError(429, `Too many failed login attempts. Try again in ${lock.retryAfterSec}s`, 'AUTH_LOCKED');
  }

  if (useMockAuth) {
    let client = getMockClientByEmail(email);
    if (!client && !hasMockClients()) {
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      client = createMockClient({
        email,
        name: email.split('@')[0] || 'Demo User',
        company_name: null,
        passwordHash,
      });
    }
    if (!client || !client.password_hash) {
      registerLoginFailure(email);
      throw new ApiError(401, 'Invalid credentials');
    }

    const ok = await bcrypt.compare(password, client.password_hash);
    if (!ok) {
      registerLoginFailure(email);
      throw new ApiError(401, 'Invalid credentials');
    }
    clearLoginFailures(email);
    const auth = issueAuthTokens(client);

    res.json({
      token: auth.token,
      refreshToken: auth.refreshToken,
      client: toClientResponse(client),
    });
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, email, name, plan, status, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.password_hash) {
    registerLoginFailure(email);
    throw new ApiError(401, 'Invalid credentials');
  }

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) {
    registerLoginFailure(email);
    throw new ApiError(401, 'Invalid credentials');
  }
  clearLoginFailures(email);
  const auth = issueAuthTokens(data);

  res.json({
    token: auth.token,
    refreshToken: auth.refreshToken,
    client: {
      id: data.id,
      email: data.email,
      name: data.name,
      plan: data.plan,
      status: data.status,
    },
  });
});

// GET /api/auth/me → current client profile (used by the dashboard)
router.get('/me', authenticateJWT, async (req, res) => {
  if (useMockAuth) {
    const client = getMockClientById(req.clientId);
    if (!client) throw new ApiError(404, 'Client not found');

    res.json({
      client: {
        ...toClientResponse(client),
        apiKey: client.api_key,
        hasBilling: false,
      },
    });
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, email, name, company_name, company_nip, plan, status, api_key, trial_ends_at, stripe_customer_id')
    .eq('id', req.clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Client not found');

  res.json({
    client: {
      id: data.id,
      email: data.email,
      name: data.name,
      companyName: data.company_name,
      companyNip: data.company_nip,
      plan: data.plan,
      status: data.status,
      apiKey: data.api_key,
      trialEndsAt: data.trial_ends_at,
      hasBilling: Boolean(data.stripe_customer_id),
    },
  });
});

// POST /api/auth/refresh
// Preferred: body { refreshToken }. Legacy fallback: Bearer access token.
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    // Legacy fallback for older dashboard clients that call /refresh using access token auth.
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!bearer) throw new ApiError(401, 'Missing refreshToken', 'REFRESH_MISSING');
    let accessPayload;
    try {
      accessPayload = jwt.verify(bearer, config.jwtSecret);
    } catch {
      throw new ApiError(401, 'Invalid bearer token', 'REFRESH_MISSING');
    }

    if (useMockAuth) {
      const client = getMockClientById(accessPayload.sub);
      if (!client) throw new ApiError(401, 'Client not found');
      const auth = issueAuthTokens(client);
      res.json({ token: auth.token, refreshToken: auth.refreshToken });
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, email')
      .eq('id', accessPayload.sub)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ApiError(401, 'Client not found');
    const auth = issueAuthTokens(data);
    res.json({ token: auth.token, refreshToken: auth.refreshToken });
    return;
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, config.refreshTokenSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token', 'REFRESH_INVALID');
  }

  if (!payload || payload.type !== 'refresh' || !payload.sub || !payload.jti) {
    throw new ApiError(401, 'Invalid refresh token payload', 'REFRESH_INVALID');
  }
  if (isRefreshTokenRevoked(payload.jti)) {
    throw new ApiError(401, 'Refresh token revoked', 'REFRESH_REVOKED');
  }
  if (!isRefreshTokenAllowed(payload.jti, payload.sub)) {
    throw new ApiError(401, 'Refresh token not recognized', 'REFRESH_UNKNOWN');
  }

  if (useMockAuth) {
    const client = getMockClientById(payload.sub);
    if (!client) throw new ApiError(401, 'Client not found');
    revokeRefreshToken(payload.jti, payload.exp);
    const auth = issueAuthTokens(client);
    res.json({ token: auth.token, refreshToken: auth.refreshToken });
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, email')
    .eq('id', payload.sub)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(401, 'Client not found');

  revokeRefreshToken(payload.jti, payload.exp);
  const auth = issueAuthTokens(data);
  res.json({ token: auth.token, refreshToken: auth.refreshToken });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    res.status(204).end();
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, config.refreshTokenSecret);
    if (payload && payload.jti) {
      revokeRefreshToken(payload.jti, payload.exp);
    }
  } catch {
    // We do not leak refresh validation errors during logout.
  }

  res.status(204).end();
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  const email = req.body && req.body.email ? String(req.body.email).trim() : '';
  if (!email) {
    res.json({ success: true });
    return;
  }

  let client = null;
  if (useMockAuth) {
    client = getMockClientByEmail(email);
  } else {
    const { data, error } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    client = data;
  }

  if (client && client.id) {
    const token = createPasswordResetToken(client.id, 60 * 60 * 1000);
    const resetLink = `${config.frontendUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;
    // Email delivery is integrated in a later phase (Resend templates).
    console.log(`[auth] password reset requested for ${email}: ${resetLink}`);
  }

  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  const token = req.body && req.body.token ? String(req.body.token) : '';
  const newPassword = req.body && req.body.newPassword ? String(req.body.newPassword) : '';
  if (!token || !newPassword) {
    throw new ApiError(400, 'token and newPassword are required', 'RESET_INVALID');
  }
  assertPasswordStrength(newPassword);

  const clientId = consumePasswordResetToken(token);
  if (!clientId) throw new ApiError(400, 'Invalid or expired reset token', 'RESET_INVALID');

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  if (useMockAuth) {
    const client = getMockClientById(clientId);
    if (!client) throw new ApiError(404, 'Client not found');
    client.password_hash = passwordHash;
    res.status(204).end();
    return;
  }

  const { error } = await supabase
    .from('clients')
    .update({ password_hash: passwordHash })
    .eq('id', clientId);
  if (error) throw error;

  res.status(204).end();
});

module.exports = router;
