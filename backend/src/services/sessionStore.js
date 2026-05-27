const crypto = require('crypto');

const refreshBlacklist = new Map(); // jti -> expiresAtMs
const refreshAllowlist = new Map(); // jti -> { clientId, expiresAtMs }
const loginAttempts = new Map(); // email -> { count, firstFailureAtMs, lockedUntilMs }
const resetTokens = new Map(); // hash -> { clientId, expiresAtMs }

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

function now() {
  return Date.now();
}

function cleanupExpired(map, extractor) {
  const t = now();
  for (const [key, value] of map.entries()) {
    const expiresAtMs = extractor(value);
    if (typeof expiresAtMs === 'number' && expiresAtMs <= t) {
      map.delete(key);
    }
  }
}

setInterval(() => {
  cleanupExpired(refreshBlacklist, (v) => v);
  cleanupExpired(refreshAllowlist, (v) => v.expiresAtMs);
  cleanupExpired(resetTokens, (v) => v.expiresAtMs);
}, 60 * 1000).unref();

function hashResetToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function registerRefreshToken(jti, clientId, expUnixSeconds) {
  const expiresAtMs = Number(expUnixSeconds) * 1000;
  refreshAllowlist.set(jti, { clientId, expiresAtMs });
}

function isRefreshTokenAllowed(jti, clientId) {
  const entry = refreshAllowlist.get(jti);
  if (!entry) return false;
  if (entry.clientId !== clientId) return false;
  if (entry.expiresAtMs <= now()) {
    refreshAllowlist.delete(jti);
    return false;
  }
  return true;
}

function revokeRefreshToken(jti, expUnixSeconds) {
  refreshAllowlist.delete(jti);
  const expiresAtMs = Number(expUnixSeconds) * 1000;
  if (Number.isFinite(expiresAtMs) && expiresAtMs > now()) {
    refreshBlacklist.set(jti, expiresAtMs);
  } else {
    refreshBlacklist.set(jti, now() + 7 * 24 * 60 * 60 * 1000);
  }
}

function isRefreshTokenRevoked(jti) {
  const expiresAtMs = refreshBlacklist.get(jti);
  if (!expiresAtMs) return false;
  if (expiresAtMs <= now()) {
    refreshBlacklist.delete(jti);
    return false;
  }
  return true;
}

function registerLoginFailure(email) {
  const key = String(email || '').toLowerCase();
  const t = now();
  const prev = loginAttempts.get(key);
  const state = prev && (t - prev.firstFailureAtMs) <= LOGIN_WINDOW_MS
    ? { ...prev }
    : { count: 0, firstFailureAtMs: t, lockedUntilMs: 0 };

  state.count += 1;
  if (state.count >= MAX_LOGIN_ATTEMPTS) {
    state.lockedUntilMs = t + LOCKOUT_MS;
  }
  loginAttempts.set(key, state);
  return {
    count: state.count,
    lockedUntilMs: state.lockedUntilMs,
  };
}

function clearLoginFailures(email) {
  const key = String(email || '').toLowerCase();
  loginAttempts.delete(key);
}

function getLockoutState(email) {
  const key = String(email || '').toLowerCase();
  const state = loginAttempts.get(key);
  if (!state) return { locked: false, retryAfterSec: 0 };
  if (state.lockedUntilMs > now()) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((state.lockedUntilMs - now()) / 1000)),
    };
  }
  if ((now() - state.firstFailureAtMs) > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
  }
  return { locked: false, retryAfterSec: 0 };
}

function createPasswordResetToken(clientId, ttlMs = 60 * 60 * 1000) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = hashResetToken(raw);
  resetTokens.set(hash, { clientId, expiresAtMs: now() + ttlMs });
  return raw;
}

function consumePasswordResetToken(rawToken) {
  const hash = hashResetToken(rawToken);
  const entry = resetTokens.get(hash);
  if (!entry) return null;
  if (entry.expiresAtMs <= now()) {
    resetTokens.delete(hash);
    return null;
  }
  resetTokens.delete(hash);
  return entry.clientId;
}

module.exports = {
  registerRefreshToken,
  isRefreshTokenAllowed,
  revokeRefreshToken,
  isRefreshTokenRevoked,
  registerLoginFailure,
  clearLoginFailures,
  getLockoutState,
  createPasswordResetToken,
  consumePasswordResetToken,
};
