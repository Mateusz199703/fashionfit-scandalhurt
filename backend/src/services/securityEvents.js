const config = require('../config');

function pickIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function logSecurityEvent(eventType, req, details = {}, level = 'warn') {
  if (!config.security.auditLogEnabled) return;

  const payload = {
    eventType,
    requestId: req.id || null,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: pickIp(req),
    userAgent: req.headers['user-agent'] || null,
    timestamp: new Date().toISOString(),
    details,
  };

  const line = `[SECURITY] ${JSON.stringify(payload)}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'info') {
    console.info(line);
  } else {
    console.warn(line);
  }
}

module.exports = {
  pickIp,
  logSecurityEvent,
};
