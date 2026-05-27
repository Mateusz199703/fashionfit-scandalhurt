const Stripe = require('stripe');
const config = require('../config');

const stripe = new Stripe(config.stripe.secretKey);

function isStripeSecretConfigured() {
  return Boolean(config.stripe.secretKey) && !String(config.stripe.secretKey).includes('placeholder');
}

function isWebhookSecretConfigured() {
  return Boolean(config.stripe.webhookSecret);
}

async function createCustomer({ email, name }) {
  return stripe.customers.create({ email, name });
}

function constructEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

async function createCheckoutSession({
  customerId,
  priceId,
  plan,
  clientId,
  shopDomain,
  source = 'dashboard',
}) {
  const metadata = {
    client_id: clientId,
    plan,
    source,
  };
  if (shopDomain) metadata.shop_domain = shopDomain;

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: clientId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${config.frontendUrl}/billing?status=success`,
    cancel_url: `${config.frontendUrl}/billing?status=cancel`,
    metadata,
    subscription_data: { metadata },
  });
}

async function listInvoices(customerId, limit = 12) {
  const result = await stripe.invoices.list({ customer: customerId, limit });
  return result.data;
}

async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

module.exports = {
  stripe,
  createCustomer,
  constructEvent,
  createCheckoutSession,
  listInvoices,
  getSubscription,
  isStripeSecretConfigured,
  isWebhookSecretConfigured,
};
