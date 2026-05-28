const fashn = require('./fashn');
const googleVto = require('./googleVto');
const config = require('../config');

const ALLOWED_PROVIDERS = ['auto', 'fashn', 'google_vto', 'mock'];

function normalizeProvider(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!ALLOWED_PROVIDERS.includes(raw)) return 'auto';
  return raw;
}

function isConfigured(provider) {
  if (provider === 'fashn') return Boolean(config.fashn.apiKey);
  if (provider === 'google_vto') {
    return Boolean(config.google.projectId)
      && (Boolean(process.env.GOOGLE_CREDENTIALS_JSON) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS));
  }
  if (provider === 'mock') return true;
  return false;
}

function defaultProviderOrder(preferredProvider) {
  const preferred = normalizeProvider(preferredProvider);
  const fallback = normalizeProvider(config.tryon.fallbackProvider);
  const defaultProvider = normalizeProvider(config.tryon.defaultProvider);

  const order = [];
  const push = (provider) => {
    if (!provider || provider === 'auto') return;
    if (!ALLOWED_PROVIDERS.includes(provider)) return;
    if (!order.includes(provider)) order.push(provider);
  };

  push(preferred);
  push(defaultProvider);
  push(fallback);
  push('google_vto');
  push('fashn');
  push('mock');

  return order.filter((provider) => isConfigured(provider) || provider === 'mock');
}

function buildMockImageUrl(sessionId) {
  const label = encodeURIComponent(`FashionFit + Google Try-On\nSession: ${String(sessionId).slice(0, 8)}`);
  return `https://placehold.co/900x1200/111111/F8F8F8?text=${label}`;
}

async function tryFashn({ modelImageUrl, garmentImageUrl, category }) {
  const predictionId = await fashn.run({
    modelImage: modelImageUrl,
    garmentImage: garmentImageUrl,
    category,
  });

  const prediction = await fashn.pollUntilComplete(predictionId);
  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!outputUrl) throw new Error('FASHN output is empty');

  return {
    provider: 'fashn',
    predictionId,
    remoteImageUrl: outputUrl,
  };
}

async function tryGoogleVto({ modelImageUrl, garmentImageUrl }) {
  const result = await googleVto.generateTryOnFromUrls({ modelImageUrl, garmentImageUrl });
  return {
    provider: 'google_vto',
    resultBase64: result.resultBase64,
    mimeType: result.mimeType || 'image/jpeg',
  };
}

async function runTryOnWithProviders(params) {
  const { sessionId, modelImageUrl, garmentImageUrl, category, preferredProvider } = params;
  const providerOrder = defaultProviderOrder(preferredProvider);
  const errors = [];

  for (const provider of providerOrder) {
    try {
      if (provider === 'fashn') {
        return await tryFashn({ modelImageUrl, garmentImageUrl, category });
      }
      if (provider === 'google_vto') {
        return await tryGoogleVto({ modelImageUrl, garmentImageUrl, category });
      }
      if (provider === 'mock') {
        return {
          provider: 'mock',
          remoteImageUrl: buildMockImageUrl(sessionId),
        };
      }
    } catch (err) {
      errors.push(`${provider}: ${err.message}`);
    }
  }

  throw new Error(`All providers failed. ${errors.join(' | ')}`);
}

function getTryOnProvidersStatus() {
  return {
    configured: {
      fashn: Boolean(config.fashn.apiKey),
      google_vto: Boolean(config.google.projectId)
        && (Boolean(process.env.GOOGLE_CREDENTIALS_JSON) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
    },
    defaultProvider: normalizeProvider(config.tryon.defaultProvider),
    fallbackProvider: normalizeProvider(config.tryon.fallbackProvider),
  };
}

module.exports = {
  ALLOWED_PROVIDERS,
  normalizeProvider,
  runTryOnWithProviders,
  getTryOnProvidersStatus,
};
