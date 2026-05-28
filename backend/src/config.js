const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function parseAllowedOrigins(value, fallback) {
  if (!value || !String(value).trim()) return [fallback];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvList(value) {
  if (!value || !String(value).trim()) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseIntOrDefault(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseWidgetAllowedOrigins() {
  const raw = process.env.WIDGET_ALLOWED_ORIGINS;
  if (raw && String(raw).trim()) return parseAllowedOrigins(raw, process.env.FRONTEND_URL || 'http://localhost:3000');
  const defaults = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.API_PUBLIC_URL || '',
  ].filter(Boolean);
  return [...new Set(defaults)];
}

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiVersion: process.env.API_VERSION || '1.0.0',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL || 'http://localhost:3000'),
  widgetAllowedOrigins: parseWidgetAllowedOrigins(),
  apiPublicUrl: process.env.API_PUBLIC_URL || '',
  adminEmails: parseCsvList(process.env.ADMIN_EMAILS),

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret-change-me',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  supabase: {
    url: process.env.SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.SUPABASE_ANON_KEY || 'anon-key-placeholder',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'service-key-placeholder',
  },

  fashn: {
    apiKey: process.env.FASHN_API_KEY || '',
    baseUrl: 'https://api.fashn.ai/v1',
    pollTimeoutMs: 60000,
    pollIntervalMs: 3000,
  },

  google: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'europe-west4',
    vtoModel: process.env.GOOGLE_VTO_MODEL || 'virtual-try-on-001',
  },

  tryon: {
    defaultProvider: process.env.TRYON_DEFAULT_PROVIDER || 'auto',
    fallbackProvider: process.env.TRYON_FALLBACK_PROVIDER || 'mock',
    allowMockInProduction: parseBoolean(process.env.TRYON_ALLOW_MOCK_IN_PRODUCTION, false),
  },

  security: {
    auditLogEnabled: parseBoolean(process.env.SECURITY_AUDIT_LOG_ENABLED, true),
    apiKeyAbuse: {
      windowMs: parseIntOrDefault(process.env.API_KEY_ABUSE_WINDOW_MS, 10 * 60 * 1000),
      maxFailures: parseIntOrDefault(process.env.API_KEY_ABUSE_MAX_FAILURES, 15),
      blockMs: parseIntOrDefault(process.env.API_KEY_ABUSE_BLOCK_MS, 30 * 60 * 1000),
    },
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    prices: {
      STARTER: process.env.STRIPE_PRICE_STARTER || '',
      GROWTH: process.env.STRIPE_PRICE_GROWTH || '',
      SCALE: process.env.STRIPE_PRICE_SCALE || '',
    },
  },

  encryptionKey: process.env.ENCRYPTION_KEY || '',

  planLimits: {
    STARTER: 100,
    GROWTH: 1000,
    SCALE: 10000,
  },

  storage: {
    uploadsBucket: 'tryon-uploads',
    resultsBucket: 'tryon-results',
  },

  demo: {
    apiKey: process.env.DEMO_API_KEY || 'ff_demo_public_key',
    shopId: process.env.DEMO_SHOP_ID || 'demo-fashionfit-shop',
    dailyLimit: parseInt(process.env.DEMO_DAILY_LIMIT, 10) || 500,
    productsSourceUrl: process.env.DEMO_PRODUCTS_SOURCE_URL
      || 'https://scandalhurt.pl/wp-json/wc/store/v1/products?per_page=12&orderby=date&order=desc',
  },
};

module.exports = config;
