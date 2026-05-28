const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../services/securityEvents');

const common = { standardHeaders: true, legacyHeaders: false };

function build429Handler(limitName) {
  return (req, res) => {
    logSecurityEvent('rate_limit_exceeded', req, { limitName });
    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT',
      limitName,
      requestId: req.id || null,
    });
  };
}

// General dashboard API limiter.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 240,
  handler: build429Handler('api'),
  ...common,
});

// Stricter limiter for auth endpoints to slow down credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: build429Handler('auth'),
  ...common,
});

// Public widget limiter (per IP, short window).
const widgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: build429Handler('widget'),
  ...common,
});

module.exports = { apiLimiter, authLimiter, widgetLimiter };
