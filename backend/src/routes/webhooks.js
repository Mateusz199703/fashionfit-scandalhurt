const express = require('express');
const config = require('../config');
const { supabase } = require('../services/supabase');
const stripeService = require('../services/stripe');
const { isMockBackendEnabled } = require('../services/mockStore');

const router = express.Router();
const useMockBackend = isMockBackendEnabled();

const PLAN_NAMES = ['STARTER', 'GROWTH', 'SCALE'];
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];
const RETRYABLE_WEBHOOK_TABLE_MISSING = new Set();

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

function normalizeDomain(value) {
  if (!value) return null;
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '') || null;
}

function mapPriceIdToPlan(priceId) {
  const target = String(priceId || '');
  if (!target) return null;
  for (const plan of PLAN_NAMES) {
    if (config.stripe.prices[plan] && config.stripe.prices[plan] === target) return plan;
  }
  return null;
}

function mapPriceToPlan(subscription) {
  const firstItem = subscription.items && subscription.items.data && subscription.items.data[0]
    ? subscription.items.data[0]
    : null;
  const price = firstItem ? firstItem.price : null;

  const metadataPlan = (
    (subscription.metadata && subscription.metadata.plan)
    || (price && (price.nickname || (price.metadata && price.metadata.plan)))
    || ''
  ).toUpperCase();

  if (PLAN_NAMES.includes(metadataPlan)) return metadataPlan;
  return mapPriceIdToPlan(price ? price.id : null);
}

async function findClientById(clientId) {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.id : null;
}

async function findClientIdByCustomer(customerId) {
  if (!customerId) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.id : null;
}

async function findClientIdBySubscriptionId(subscriptionId) {
  if (!subscriptionId) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('client_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data ? data.client_id : null;
}

async function resolveClientId({ metadata, clientReferenceId, customerId, subscriptionId }) {
  const directCandidates = [
    metadata && metadata.client_id ? metadata.client_id : null,
    clientReferenceId || null,
  ].filter(Boolean);

  for (const candidate of directCandidates) {
    const id = await findClientById(candidate);
    if (id) return id;
  }

  const byCustomer = await findClientIdByCustomer(customerId);
  if (byCustomer) return byCustomer;

  return findClientIdBySubscriptionId(subscriptionId);
}

async function ensureClientShop(clientId, rawDomain) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) return;

  const { count, error: countError } = await supabase
    .from('shops')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);
  if (countError) throw countError;
  if ((count || 0) > 0) return;

  const { error } = await supabase
    .from('shops')
    .insert({
      client_id: clientId,
      name: 'Twój sklep',
      domain,
      platform: 'woocommerce',
      widget_config: {
        primaryColor: '#111111',
        buttonLabel: 'Przymierz wirtualnie ✨',
        position: 'bottom-right',
        showLiveAR: true,
        showPhotoAI: true,
      },
      is_active: true,
    });
  if (error) throw error;
}

async function upsertSubscription({
  clientId,
  subscriptionId,
  status,
  plan,
  currentPeriodStart,
  currentPeriodEnd,
}) {
  const { error } = await supabase.from('subscriptions').upsert(
    {
      client_id: clientId,
      stripe_subscription_id: subscriptionId,
      status,
      plan,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: 'stripe_subscription_id' },
  );
  if (error) throw error;
}

async function updateClientSubscriptionState({ clientId, customerId, subscriptionStatus, plan }) {
  const patch = {
    status: ACTIVE_STATUSES.includes(subscriptionStatus) ? 'active' : 'inactive',
  };
  if (customerId) patch.stripe_customer_id = customerId;
  if (plan) patch.plan = plan;

  const { error } = await supabase.from('clients').update(patch).eq('id', clientId);
  if (error) throw error;
}

function isWebhookTableMissing(error) {
  if (!error) return false;
  return error.code === '42P01' || /stripe_webhook_events/i.test(String(error.message || ''));
}

async function claimEvent(event) {
  if (useMockBackend) {
    if (RETRYABLE_WEBHOOK_TABLE_MISSING.has(event.id)) return { shouldProcess: false };
    RETRYABLE_WEBHOOK_TABLE_MISSING.add(event.id);
    return { shouldProcess: true, mode: 'memory' };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .insert({
      event_id: event.id,
      event_type: event.type,
      status: 'processing',
      payload: event.data ? event.data.object : null,
      first_seen_at: now,
      last_seen_at: now,
      processed_at: null,
      error_message: null,
    })
    .select('id, status')
    .maybeSingle();

  if (!error) return { shouldProcess: true, mode: 'db', rowId: data.id };

  if (isWebhookTableMissing(error)) {
    if (RETRYABLE_WEBHOOK_TABLE_MISSING.has(event.id)) return { shouldProcess: false };
    RETRYABLE_WEBHOOK_TABLE_MISSING.add(event.id);
    return { shouldProcess: true, mode: 'memory' };
  }

  if (error.code !== '23505') throw error;

  const { data: existing, error: fetchError } = await supabase
    .from('stripe_webhook_events')
    .select('id, status')
    .eq('event_id', event.id)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (!existing) return { shouldProcess: false };

  if (existing.status === 'failed') {
    const { error: updateError } = await supabase
      .from('stripe_webhook_events')
      .update({
        status: 'processing',
        error_message: null,
        processed_at: null,
        last_seen_at: now,
      })
      .eq('id', existing.id);
    if (updateError) throw updateError;
    return { shouldProcess: true, mode: 'db', rowId: existing.id };
  }

  return { shouldProcess: false };
}

async function finishEvent(claim, status, errorMessage = null) {
  if (!claim || !claim.mode) return;

  if (claim.mode === 'memory') {
    if (status === 'failed') {
      RETRYABLE_WEBHOOK_TABLE_MISSING.delete(claim.eventId);
    }
    return;
  }

  const { error } = await supabase
    .from('stripe_webhook_events')
    .update({
      status,
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', claim.rowId);

  // If migration is missing in an already-running deployment, do not fail
  // business webhook processing just because audit persistence failed.
  if (error && !isWebhookTableMissing(error)) {
    throw error;
  }
}

async function handleCheckoutCompleted(session) {
  const paymentStatus = String(session.payment_status || '').toLowerCase();
  if (paymentStatus && !['paid', 'no_payment_required'].includes(paymentStatus)) return;

  // For subscription onboarding we activate the tenant only after successful
  // checkout completion webhook, never from frontend redirects.
  const clientId = await resolveClientId({
    metadata: session.metadata,
    clientReferenceId: session.client_reference_id,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });
  if (!clientId) return;

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  let subscription = null;
  if (subscriptionId) {
    subscription = await stripeService.getSubscription(subscriptionId);
  }

  const plan = subscription
    ? mapPriceToPlan(subscription)
    : (session.metadata && PLAN_NAMES.includes(String(session.metadata.plan || '').toUpperCase())
      ? String(session.metadata.plan).toUpperCase()
      : null);

  if (subscriptionId) {
    await upsertSubscription({
      clientId,
      subscriptionId,
      status: subscription ? subscription.status : 'active',
      plan,
      currentPeriodStart: subscription ? toIso(subscription.current_period_start) : null,
      currentPeriodEnd: subscription ? toIso(subscription.current_period_end) : null,
    });
  }

  await updateClientSubscriptionState({
    clientId,
    customerId: session.customer || null,
    subscriptionStatus: subscription ? subscription.status : 'active',
    plan,
  });

  await ensureClientShop(clientId, session.metadata ? session.metadata.shop_domain : null);
}

async function handleSubscriptionUpdated(subscription) {
  const clientId = await resolveClientId({
    metadata: subscription.metadata,
    clientReferenceId: null,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
  });
  if (!clientId) return;

  const plan = mapPriceToPlan(subscription);

  await upsertSubscription({
    clientId,
    subscriptionId: subscription.id,
    status: subscription.status,
    plan,
    currentPeriodStart: toIso(subscription.current_period_start),
    currentPeriodEnd: toIso(subscription.current_period_end),
  });

  await updateClientSubscriptionState({
    clientId,
    customerId: subscription.customer || null,
    subscriptionStatus: subscription.status,
    plan,
  });
}

async function handleSubscriptionDeleted(subscription) {
  const clientId = await resolveClientId({
    metadata: subscription.metadata,
    clientReferenceId: null,
    customerId: subscription.customer,
    subscriptionId: subscription.id,
  });

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
  if (subError) throw subError;

  if (clientId) {
    const { error: clientError } = await supabase
      .from('clients')
      .update({
        status: 'inactive',
        stripe_customer_id: subscription.customer || null,
      })
      .eq('id', clientId);
    if (clientError) throw clientError;
  }
}

// POST /api/webhooks/stripe — requires the raw body for signature verification.
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeService.isWebhookSecretConfigured()) {
    return res.status(503).json({ error: 'Stripe webhook secret is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeService.constructEvent(req.body, signature);
  } catch (e) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${e.message}` });
  }

  const claim = await claimEvent(event);
  if (!claim.shouldProcess) {
    return res.json({ received: true, duplicate: true });
  }
  claim.eventId = event.id;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }

    await finishEvent(claim, 'processed', null);
    return res.json({ received: true });
  } catch (e) {
    await finishEvent(claim, 'failed', e.message || 'Webhook processing failed');
    throw e;
  }
});

module.exports = router;
