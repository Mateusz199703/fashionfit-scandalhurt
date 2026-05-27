const express = require('express');
const { supabase } = require('../services/supabase');
const stripeService = require('../services/stripe');

const router = express.Router();

const PLAN_NAMES = ['STARTER', 'GROWTH', 'SCALE'];
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

async function findClientIdByCustomer(customerId) {
  if (!customerId) return null;
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data ? data.id : null;
}

function mapPriceToPlan(subscription) {
  const price = subscription.items && subscription.items.data && subscription.items.data[0]
    ? subscription.items.data[0].price
    : null;
  const candidate = (
    (price && (price.nickname || (price.metadata && price.metadata.plan))) ||
    (subscription.metadata && subscription.metadata.plan) ||
    ''
  ).toUpperCase();
  return PLAN_NAMES.includes(candidate) ? candidate : null;
}

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

async function handleCheckoutCompleted(session) {
  const clientId = await findClientIdByCustomer(session.customer);
  if (!clientId) return;
  await supabase.from('clients').update({ status: 'active' }).eq('id', clientId);
  if (session.subscription) {
    await supabase.from('subscriptions').upsert(
      { client_id: clientId, stripe_subscription_id: session.subscription, status: 'active' },
      { onConflict: 'stripe_subscription_id' },
    );
  }
}

async function handleSubscriptionUpdated(subscription) {
  const clientId = await findClientIdByCustomer(subscription.customer);
  if (!clientId) return;
  const plan = mapPriceToPlan(subscription);

  await supabase.from('subscriptions').upsert(
    {
      client_id: clientId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan,
      current_period_start: toIso(subscription.current_period_start),
      current_period_end: toIso(subscription.current_period_end),
    },
    { onConflict: 'stripe_subscription_id' },
  );

  const patch = { status: ACTIVE_STATUSES.includes(subscription.status) ? 'active' : 'inactive' };
  if (plan) patch.plan = plan;
  await supabase.from('clients').update(patch).eq('id', clientId);
}

async function handleSubscriptionDeleted(subscription) {
  const clientId = await findClientIdByCustomer(subscription.customer);
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
  if (clientId) {
    await supabase.from('clients').update({ status: 'inactive' }).eq('id', clientId);
  }
}

// POST /api/webhooks/stripe — requires the raw body for signature verification.
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeService.constructEvent(req.body, signature);
  } catch (e) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${e.message}` });
  }

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

  res.json({ received: true });
});

module.exports = router;
