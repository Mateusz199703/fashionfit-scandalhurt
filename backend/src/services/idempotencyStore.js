const entries = new Map();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function now() {
  return Date.now();
}

function cleanup() {
  const t = now();
  for (const [key, value] of entries.entries()) {
    if (value.expiresAtMs <= t) entries.delete(key);
  }
}

setInterval(cleanup, 60 * 1000).unref();

function makeKey({ clientId, shopId, idempotencyKey }) {
  return `${clientId}:${shopId}:${String(idempotencyKey).trim()}`;
}

function get({ clientId, shopId, idempotencyKey }) {
  if (!idempotencyKey) return null;
  const key = makeKey({ clientId, shopId, idempotencyKey });
  const entry = entries.get(key);
  if (!entry) return null;
  if (entry.expiresAtMs <= now()) {
    entries.delete(key);
    return null;
  }
  return entry;
}

function set({ clientId, shopId, idempotencyKey, sessionId, ttlMs = DEFAULT_TTL_MS }) {
  if (!idempotencyKey || !sessionId) return;
  const key = makeKey({ clientId, shopId, idempotencyKey });
  entries.set(key, {
    sessionId,
    createdAtMs: now(),
    expiresAtMs: now() + ttlMs,
  });
}

module.exports = { get, set };
