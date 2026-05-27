const express = require('express');
const config = require('../config');
const { supabase } = require('../services/supabase');
const stripeService = require('../services/stripe');
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
    .select('id, email, name, plan, status, trial_ends_at, stripe_customer_id')
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

// GET /api/billing/overview → plan, period and this month's usage
router.get('/overview', async (req, res) => {
  if (useMockBackend) {
    const data = getMockBillingOverview(req.clientId);
    if (!data) throw new ApiError(404, 'Client not found');
    res.json(data);
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
        amount: (inv.amount_paid || 0) / 100,
        currency: inv.currency,
        status: inv.status,
        url: inv.hosted_invoice_url,
      })),
    });
  } catch (e) {
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

  const { plan } = req.body || {};
  const priceId = config.stripe.prices[plan];
  if (!priceId) throw new ApiError(400, 'This plan is not available for checkout');

  const client = await getClient(req.clientId);
  let customerId = client.stripe_customer_id;
  if (!customerId) {
    const customer = await stripeService.createCustomer({ email: client.email, name: client.name });
    customerId = customer.id;
    await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', req.clientId);
  }

  const session = await stripeService.createCheckoutSession({
    customerId,
    priceId,
    plan,
    clientId: req.clientId,
  });
  res.json({ url: session.url });
});

module.exports = router;
