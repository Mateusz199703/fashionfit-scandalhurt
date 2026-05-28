const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const validateEnv = require('./config/validateEnv');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const keysRoutes = require('./routes/keys');
const widgetRoutes = require('./routes/widget');
const webhookRoutes = require('./routes/webhooks');
const fashnService = require('./services/fashn');
const tryonWorker = require('./services/tryonWorker');

const packageJson = require('../package.json');

validateEnv(config);

const app = express();
app.disable('x-powered-by');

const widgetCors = cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Idempotency-Key', 'Authorization'],
  methods: ['GET', 'POST', 'OPTIONS'],
});

const dashboardCors = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
});

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('Request-Id', req.id);
  res.setHeader('API-Version', config.apiVersion);
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

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: packageJson.version || '0.0.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      fashn_circuit: fashnService.getCircuitState(),
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
  app.use(`${prefix}/auth`, dashboardCors, authRoutes);
  app.use(`${prefix}/shops`, dashboardCors, apiLimiter, shopRoutes);
  app.use(`${prefix}/products`, dashboardCors, apiLimiter, productRoutes);
  app.use(`${prefix}/analytics`, dashboardCors, apiLimiter, analyticsRoutes);
  app.use(`${prefix}/billing`, dashboardCors, apiLimiter, billingRoutes);
  app.use(`${prefix}/keys`, dashboardCors, apiLimiter, keysRoutes);
  app.use(`${prefix}/widget`, widgetCors, widgetRoutes);
}

// Primary API namespace
mountVersionedApi('/api/v1');

// Backward compatibility for existing plugin/dashboard installs.
mountVersionedApi('/api');

app.use(notFound);
app.use(errorHandler);

module.exports = app;
