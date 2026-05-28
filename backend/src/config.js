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

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiVersion: process.env.API_VERSION || '1.0.0',

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL || 'http://localhost:3000'),
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
};

module.exports = config;
