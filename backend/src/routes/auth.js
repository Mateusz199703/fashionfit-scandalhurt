const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockAuth = isMockBackendEnabled();

function signToken(client) {
  return jwt.sign({ sub: client.id, email: client.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
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

    const passwordHash = await bcrypt.hash(password, 10);
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

    res.status(201).json({
      token: signToken(client),
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

  const passwordHash = await bcrypt.hash(password, 10);

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

  res.status(201).json({
    token: signToken(data),
    apiKey: generated.rawKey,
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

  if (useMockAuth) {
    let client = getMockClientByEmail(email);
    if (!client && !hasMockClients()) {
      const passwordHash = await bcrypt.hash(password, 10);
      client = createMockClient({
        email,
        name: email.split('@')[0] || 'Demo User',
        company_name: null,
        passwordHash,
      });
    }
    if (!client || !client.password_hash) throw new ApiError(401, 'Invalid credentials');

    const ok = await bcrypt.compare(password, client.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid credentials');

    res.json({
      token: signToken(client),
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
  if (!data || !data.password_hash) throw new ApiError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  res.json({
    token: signToken(data),
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

// POST /api/auth/refresh → issue a fresh token for the authenticated client
router.post('/refresh', authenticateJWT, async (req, res) => {
  if (useMockAuth) {
    const client = getMockClientById(req.clientId);
    if (!client) throw new ApiError(401, 'Client not found');
    res.json({ token: signToken(client) });
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id, email')
    .eq('id', req.clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(401, 'Client not found');
  res.json({ token: signToken(data) });
});

module.exports = router;
