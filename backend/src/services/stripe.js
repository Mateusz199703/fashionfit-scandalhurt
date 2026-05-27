const Stripe = require('stripe');
const config = require('../config');

const stripe = new Stripe(config.stripe.secretKey);

function isStripeSecretConfigured() {
  return Boolean(config.stripe.secretKey) && !String(config.stripe.secretKey).includes('placeholder');
}

function isWebhookSecretConfigured() {
  return Boolean(config.stripe.webhookSecret);
}

function normalizeCompanyNip(nip) {
  if (!nip) return null;
  const digits = String(nip).replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return digits;
}

async function upsertCustomerTaxId(customerId, nip) {
  const normalized = normalizeCompanyNip(nip);
  if (!customerId || !normalized) return null;

  const taxValue = `PL${normalized}`;
  const existing = await stripe.customers.listTaxIds(customerId, { limit: 100 });
  const hasAlready = (existing.data || []).some((item) => item.type === 'eu_vat' && item.value === taxValue);
  if (hasAlready) return null;

  return stripe.customers.createTaxId(customerId, {
    type: 'eu_vat',
    value: taxValue,
  });
}

async function createCustomer({ email, name, companyNip }) {
  const customer = await stripe.customers.create({ email, name });
  if (companyNip) {
    try {
      await upsertCustomerTaxId(customer.id, companyNip);
    } catch (err) {
      console.warn('Stripe tax ID creation skipped:', err.message);
    }
  }
  return customer;
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
  normalizeCompanyNip,
  upsertCustomerTaxId,
};
