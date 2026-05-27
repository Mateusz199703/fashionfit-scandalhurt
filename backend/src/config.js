const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPublicUrl: process.env.API_PUBLIC_URL || '',

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: '7d',

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

  // Monthly try-on allowance per plan, used for usage metering in the dashboard.
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
