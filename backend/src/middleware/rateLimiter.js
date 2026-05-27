const rateLimit = require('express-rate-limit');

const common = { standardHeaders: true, legacyHeaders: false };

// General dashboard API limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  ...common,
});

// Stricter limiter for auth endpoints to slow down credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later' },
  ...common,
});

// Public widget limiter (per IP, short window).
const widgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  ...common,
});

module.exports = { apiLimiter, authLimiter, widgetLimiter };
