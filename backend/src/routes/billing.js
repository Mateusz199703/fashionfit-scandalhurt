const express = require('express');
const config = require('../config');
const { supabase } = require('../services/supabase');
const stripeService = require('../services/stripe');
const { isAdminEmail } = require('../services/admin');
const {
  isMockBackendEnabled,
  getMockClientById,
  getMockBillingOverview,
} = require('../services/mockStore');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();
const useMockBackend = isMockBackendEnabled();
router.use(authenticateJWT);

async function getClient(clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, email, name, company_nip, plan, status, trial_ends_at, stripe_customer_id')
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Client not found');
  return data;
}

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function isWebhookTableMissing(err) {
  if (!err) return false;
  return err.code === '42P01' || /stripe_webhook_events/i.test(String(err.message || ''));
}

function planAvailability() {
  return {
    STARTER: Boolean(config.stripe.prices.STARTER),
    GROWTH: Boolean(config.stripe.prices.GROWTH),
    SCALE: Boolean(config.stripe.prices.SCALE),
  };
}

// GET /api/billing/overview → plan, period and this month's usage
router.get('/overview', async (req, res) => {
  if (useMockBackend) {
    const data = getMockBillingOverview(req.clientId);
    if (!data) throw new ApiError(404, 'Client not found');
    res.json({
      ...data,
      checkoutEnabled: true,
      availablePlans: { STARTER: true, GROWTH: true, SCALE: true },
    });
    return;
  }

  const client = await getClient(req.clientId);

  const { data: shops } = await supabase
    .from('shops')
    .select('id')
    .eq('client_id', req.clientId);
  const shopIds = (shops || []).map((s) => s.id);

  let used = 0;
  if (shopIds.length) {
    const { count } = await supabase
      .from('tryon_sessions')
      .select('id', { count: 'exact', head: true })
      .in('shop_id', shopIds)
      .gte('created_at', monthStartIso());
    used = count || 0;
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end, status')
    .eq('client_id', req.clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  res.json({
    plan: client.plan,
    status: client.status,
    trialEndsAt: client.trial_ends_at,
    periodStart: sub ? sub.current_period_start : null,
    periodEnd: sub ? sub.current_period_end : null,
    usage: { used, limit: config.planLimits[client.plan] || 0 },
    checkoutEnabled: stripeService.isStripeSecretConfigured(),
    availablePlans: planAvailability(),
  });
});

// GET /api/billing/status → Stripe diagnostics for dashboard UI
router.get('/status', async (req, res) => {
  if (!isAdminEmail(req.client && req.client.email)) {
    throw new ApiError(403, 'Forbidden');
  }

  if (useMockBackend) {
    if (!getMockClientById(req.clientId)) throw new ApiError(404, 'Client not found');
    res.json({
      stripeConfigured: false,
      webhookConfigured: false,
      stripeCustomerLinked: false,
      lastWebhookEvent: null,
    });
    return;
  }

  const client = await getClient(req.clientId);
  let lastWebhookEvent = null;

  try {
    const { data, error } = await supabase
      .from('stripe_webhook_events')
      .select('event_id, event_type, status, processed_at, created_at, error_message')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    lastWebhookEvent = data || null;
  } catch (err) {
    if (!isWebhookTableMissing(err)) throw err;
  }

  res.json({
    stripeConfigured: stripeService.isStripeSecretConfigured(),
    webhookConfigured: stripeService.isWebhookSecretConfigured(),
    stripeCustomerLinked: Boolean(client.stripe_customer_id),
    lastWebhookEvent,
  });
});

// GET /api/billing/history → recent Stripe invoices
router.get('/history', async (req, res) => {
  if (useMockBackend) {
    if (!getMockClientById(req.clientId)) throw new ApiError(404, 'Client not found');
    res.json({ payments: [] });
    return;
  }

  const client = await getClient(req.clientId);
  if (!client.stripe_customer_id) return res.json({ payments: [] });

  try {
    const invoices = await stripeService.listInvoices(client.stripe_customer_id, 12);
    res.json({
      payments: invoices.map((inv) => ({
        id: inv.id,
        date: new Date(inv.created * 1000).toISOString(),
        amount: ((inv.amount_paid || inv.amount_due || 0) / 100),
        currency: inv.currency,
        status: inv.status,
        url: inv.hosted_invoice_url || inv.invoice_pdf || null,
      })),
    });
  } catch (e) {
    console.warn('Stripe invoice list failed:', e.message);
    res.json({ payments: [] });
  }
});

// POST /api/billing/checkout → create a Stripe Checkout session for a plan
router.post('/checkout', async (req, res) => {
  if (useMockBackend) {
    const { plan } = req.body || {};
    if (!plan || !config.planLimits[plan]) throw new ApiError(400, 'This plan is not available for checkout');
    res.json({ url: `${config.frontendUrl}/billing?status=success` });
    return;
  }

  const { plan, shopDomain } = req.body || {};
  const normalizedPlan = String(plan || '').toUpperCase();
  const priceId = config.stripe.prices[normalizedPlan];
  if (!config.planLimits[normalizedPlan]) {
    throw new ApiError(400, 'Unknown plan');
  }
  if (!stripeService.isStripeSecretConfigured()) {
    throw new ApiError(503, 'Stripe is not configured on the server yet');
  }
  if (!priceId) {
    throw new ApiError(503, `Plan ${normalizedPlan} is not configured for checkout yet`, 'PLAN_NOT_CONFIGURED');
  }

  const client = await getClient(req.clientId);
  let customerId = client.stripe_customer_id;
  if (!customerId) {
    const customer = await stripeService.createCustomer({
      email: client.email,
      name: client.name,
      companyNip: client.company_nip,
    });
    customerId = customer.id;
    await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', req.clientId);
  }
  if (client.company_nip) {
    try {
      await stripeService.upsertCustomerTaxId(customerId, client.company_nip);
    } catch (err) {
      console.warn('Stripe tax ID sync skipped:', err.message);
    }
  }

  const session = await stripeService.createCheckoutSession({
    customerId,
    priceId,
    plan: normalizedPlan,
    clientId: req.clientId,
    shopDomain: shopDomain || null,
    source: 'dashboard_upgrade',
  });
  res.json({ url: session.url });
});

// POST /api/billing/portal → open Stripe customer portal
router.post('/portal', async (req, res) => {
  if (useMockBackend) {
    res.json({ url: `${config.frontendUrl}/billing` });
    return;
  }

  if (!stripeService.isStripeSecretConfigured()) {
    throw new ApiError(503, 'Stripe is not configured on the server yet');
  }

  const client = await getClient(req.clientId);
  if (!client.stripe_customer_id) {
    throw new ApiError(400, 'No Stripe customer is linked to this account yet');
  }

  const session = await stripeService.createBillingPortalSession(client.stripe_customer_id);
  res.json({ url: session.url });
});

module.exports = router;
