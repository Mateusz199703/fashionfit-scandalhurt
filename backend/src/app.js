const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const validateEnv = require('./config/validateEnv');
const { ApiError, notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, widgetLimiter } = require('./middleware/rateLimiter');
const { logSecurityEvent } = require('./services/securityEvents');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const moduleRoutes = require('./routes/modules');
const advisorRoutes = require('./routes/advisor');
const keysRoutes = require('./routes/keys');
const onboardingRoutes = require('./routes/onboarding');
const widgetRoutes = require('./routes/widget');
const demoRoutes = require('./routes/demo');
const webhookRoutes = require('./routes/webhooks');
const fashnService = require('./services/fashn');
const tryonWorker = require('./services/tryonWorker');
const googleVto = require('./services/googleVto');
const { getTryOnProvidersStatus } = require('./services/tryonProviderRouter');

const packageJson = require('../package.json');

validateEnv(config);

const app = express();
app.disable('x-powered-by');

function isOriginAllowed(origin, allowedList = []) {
  if (!origin) return true;
  if (allowedList.includes('*')) return true;

  try {
    const originUrl = new URL(origin);
    return allowedList.some((allowed) => {
      if (!allowed) return false;
      const normalized = String(allowed).trim();
      if (!normalized) return false;
      if (normalized === origin) return true;

      if (normalized.startsWith('*.')) {
        const host = normalized.slice(2);
        return originUrl.hostname === host || originUrl.hostname.endsWith(`.${host}`);
      }

      try {
        const allowedUrl = new URL(normalized);
        return allowedUrl.origin === originUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

const widgetCors = cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin, config.widgetAllowedOrigins)) return callback(null, true);
    return callback(new ApiError(403, `Widget CORS blocked for origin: ${origin}`, 'CORS_BLOCKED'));
  },
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Idempotency-Key', 'Authorization'],
  methods: ['GET', 'POST', 'OPTIONS'],
});

const dashboardCors = cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin, config.allowedOrigins)) return callback(null, true);
    return callback(new ApiError(403, `CORS blocked for origin: ${origin}`, 'CORS_BLOCKED'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
});

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('Request-Id', req.id);
  res.setHeader('API-Version', config.apiVersion);

  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      logSecurityEvent('http_security_status', req, { statusCode: res.statusCode }, 'info');
    }
  });

  next();
});

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Stripe webhooks must be mounted before JSON parser (raw body signature).
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '15mb' }));

app.get('/health', async (req, res) => {
  const googleAvailable = await googleVto.healthCheck();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: packageJson.version || '0.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      fashn_circuit: fashnService.getCircuitState(),
      tryon_providers: {
        ...getTryOnProvidersStatus(),
        googleConnectivity: googleAvailable,
      },
      tryon_worker: tryonWorker.getStats(),
    },
  });
});

app.get('/widget.js', (req, res) => {
  const widgetPath = path.resolve(__dirname, '../../widget/dist/widget.js');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.type('application/javascript');
  res.sendFile(widgetPath);
});

function mountVersionedApi(prefix) {
  app.use(`${prefix}/auth`, dashboardCors, authLimiter, authRoutes);
  app.use(`${prefix}/shops`, dashboardCors, apiLimiter, shopRoutes);
  app.use(`${prefix}/products`, dashboardCors, apiLimiter, productRoutes);
  app.use(`${prefix}/analytics`, dashboardCors, apiLimiter, analyticsRoutes);
  app.use(`${prefix}/billing`, dashboardCors, apiLimiter, billingRoutes);
  app.use(`${prefix}/modules`, dashboardCors, apiLimiter, moduleRoutes);
  app.use(`${prefix}/advisor`, dashboardCors, apiLimiter, advisorRoutes);
  app.use(`${prefix}/keys`, dashboardCors, apiLimiter, keysRoutes);
  app.use(`${prefix}/onboarding`, dashboardCors, apiLimiter, onboardingRoutes);
  app.use(`${prefix}/widget`, widgetCors, widgetLimiter, widgetRoutes);
  app.use(`${prefix}/demo`, widgetCors, apiLimiter, demoRoutes);
}

// Primary API namespace
mountVersionedApi('/api/v1');

// Backward compatibility for existing plugin/dashboard installs.
mountVersionedApi('/api');

app.use(notFound);
app.use(errorHandler);

module.exports = app;
