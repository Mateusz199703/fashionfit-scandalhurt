const config = require('./config');
const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const widgetRoutes = require('./routes/widget');
const webhookRoutes = require('./routes/webhooks');

const app = express();

// Dashboard requests come from the configured frontend origin; the public
// widget is embedded on arbitrary shop domains, so it gets permissive CORS.
const dashboardCors = cors({ origin: config.frontendUrl, credentials: true });
const widgetCors = cors();

app.use(helmet({
  // Widget is embedded on external WooCommerce domains, so we cannot keep
  // same-origin only resource policy globally.
  crossOriginResourcePolicy: false,
}));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// Stripe webhooks need the raw request body, so mount before the JSON parser.
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fashionfit-backend' });
});

// Serve embeddable widget bundle from the backend origin so stores do not
// depend on a separate CDN hostname during setup.
app.get('/widget.js', (req, res) => {
  const widgetPath = path.resolve(__dirname, '../../widget/dist/widget.js');
  res.setHeader('Cache-Control', 'public, max-age=300');
  // Allow embedding the script from any storefront domain.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.type('application/javascript');
  res.sendFile(widgetPath);
});

app.use('/api/auth', dashboardCors, authRoutes);
app.use('/api/shops', dashboardCors, apiLimiter, shopRoutes);
app.use('/api/products', dashboardCors, apiLimiter, productRoutes);
app.use('/api/analytics', dashboardCors, apiLimiter, analyticsRoutes);
app.use('/api/billing', dashboardCors, apiLimiter, billingRoutes);
app.use('/api/widget', widgetCors, widgetRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`FashionFit backend listening on port ${config.port}`);
});
