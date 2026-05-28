const config = require('../config');

const state = new Map();

function now() {
  return Date.now();
}

function sanitizeKey(raw) {
  return String(raw || '').trim().toLowerCase().slice(0, 80) || 'unknown';
}

function buildFingerprint(ip, keyPrefix) {
  return `${sanitizeKey(ip)}::${sanitizeKey(keyPrefix)}`;
}

function getState(fingerprint) {
  const entry = state.get(fingerprint);
  if (!entry) return null;

  const t = now();
  if (entry.blockedUntilMs && entry.blockedUntilMs <= t) {
    state.delete(fingerprint);
    return null;
  }

  if (entry.firstFailureAtMs && (t - entry.firstFailureAtMs) > config.security.apiKeyAbuse.windowMs) {
    state.delete(fingerprint);
    return null;
  }

  return entry;
}

function getBlockState(ip, keyPrefix) {
  const fingerprint = buildFingerprint(ip, keyPrefix);
  const entry = getState(fingerprint);
  if (!entry || !entry.blockedUntilMs) return { blocked: false, retryAfterSec: 0 };

  const retryAfterSec = Math.max(1, Math.ceil((entry.blockedUntilMs - now()) / 1000));
  return { blocked: true, retryAfterSec };
}

function registerFailure(ip, keyPrefix) {
  const fingerprint = buildFingerprint(ip, keyPrefix);
  const t = now();
  const prev = getState(fingerprint);

  const next = prev
    ? { ...prev }
    : { count: 0, firstFailureAtMs: t, blockedUntilMs: 0 };

  if ((t - next.firstFailureAtMs) > config.security.apiKeyAbuse.windowMs) {
    next.count = 0;
    next.firstFailureAtMs = t;
    next.blockedUntilMs = 0;
  }

  next.count += 1;
  if (next.count >= config.security.apiKeyAbuse.maxFailures) {
    next.blockedUntilMs = t + config.security.apiKeyAbuse.blockMs;
  }

  state.set(fingerprint, next);
  return {
    count: next.count,
    blockedUntilMs: next.blockedUntilMs,
  };
}

function clearFailures(ip, keyPrefix) {
  const fingerprint = buildFingerprint(ip, keyPrefix);
  state.delete(fingerprint);
}

setInterval(() => {
  const t = now();
  for (const [fingerprint, entry] of state.entries()) {
    const windowExpired = entry.firstFailureAtMs && ((t - entry.firstFailureAtMs) > config.security.apiKeyAbuse.windowMs);
    const blockExpired = entry.blockedUntilMs && entry.blockedUntilMs <= t;
    if (windowExpired || blockExpired) state.delete(fingerprint);
  }
}, 60 * 1000).unref();

module.exports = {
  getBlockState,
  registerFailure,
  clearFailures,
};
