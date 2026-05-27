const Stripe = require('stripe');
const config = require('../config');

const stripe = new Stripe(config.stripe.secretKey);

async function createCustomer({ email, name }) {
  return stripe.customers.create({ email, name });
}

function constructEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

async function createCheckoutSession({ customerId, priceId, plan, clientId }) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.frontendUrl}/billing?status=success`,
    cancel_url: `${config.frontendUrl}/billing?status=cancel`,
    metadata: { client_id: clientId, plan },
    subscription_data: { metadata: { client_id: clientId, plan } },
  });
}

async function listInvoices(customerId, limit = 12) {
  const result = await stripe.invoices.list({ customer: customerId, limit });
  return result.data;
}

module.exports = { stripe, createCustomer, constructEvent, createCheckoutSession, listInvoices };
