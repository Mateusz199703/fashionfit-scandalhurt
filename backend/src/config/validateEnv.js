const URL_KEYS = ['SUPABASE_URL', 'FRONTEND_URL'];

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return Boolean(u.protocol && u.host);
  } catch {
    return false;
  }
}

function assertMinLength(name, value, min, required) {
  if (!value) {
    if (required) throw new Error(`Missing required environment variable: ${name}`);
    return;
  }
  if (String(value).trim().length < min) {
    throw new Error(`Environment variable ${name} must be at least ${min} characters`);
  }
}

function validateEnv(config) {
  const isProduction = (config && config.env ? config.env : process.env.NODE_ENV) === 'production';

  const requiredInProd = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'FRONTEND_URL',
    'API_PUBLIC_URL',
    'ENCRYPTION_KEY',
  ];

  if (isProduction) {
    for (const key of requiredInProd) {
      const value = process.env[key];
      if (!value) throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const port = Number(process.env.PORT || config.port || 3001);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Environment variable PORT must be a valid TCP port');
  }

  assertMinLength('JWT_SECRET', process.env.JWT_SECRET, isProduction ? 32 : 12, isProduction);
  const effectiveRefreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  assertMinLength('REFRESH_TOKEN_SECRET', effectiveRefreshSecret, isProduction ? 32 : 12, isProduction);

  if (process.env.API_PUBLIC_URL && !isValidUrl(process.env.API_PUBLIC_URL)) {
    throw new Error('Environment variable API_PUBLIC_URL must be a valid URL');
  }

  for (const key of URL_KEYS) {
    const value = process.env[key];
    if (value && !isValidUrl(value)) {
      throw new Error(`Environment variable ${key} must be a valid URL`);
    }
  }

  const hasStripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasStripeWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  if (isProduction && (hasStripeSecret || hasStripeWebhookSecret) && !(hasStripeSecret && hasStripeWebhookSecret)) {
    throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set together');
  }

  const advisorAiEnabled = String(process.env.ADVISOR_AI_ENABLED || '').trim().toLowerCase() === 'true';
  if (advisorAiEnabled && !process.env.OPENAI_API_KEY) {
    console.warn('ADVISOR_AI_ENABLED=true but OPENAI_API_KEY is missing; advisor AI will be unavailable and deterministic fallback will be used.');
  }

  if (process.env.OPENAI_TIMEOUT_MS) {
    const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS);
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('OPENAI_TIMEOUT_MS must be a positive integer');
    }
  }

  if (process.env.OPENAI_MAX_OUTPUT_TOKENS) {
    const maxTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS);
    if (!Number.isInteger(maxTokens) || maxTokens <= 0) {
      throw new Error('OPENAI_MAX_OUTPUT_TOKENS must be a positive integer');
    }
  }

  if (process.env.OPENAI_TEMPERATURE) {
    const temperature = Number(process.env.OPENAI_TEMPERATURE);
    if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
      throw new Error('OPENAI_TEMPERATURE must be a number between 0 and 2');
    }
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && !/^[a-fA-F0-9]{64}$/.test(encryptionKey)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }
}

module.exports = validateEnv;
