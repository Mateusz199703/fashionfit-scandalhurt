const crypto = require('crypto');
const { supabase } = require('./supabase');
const { ApiError } = require('../middleware/errorHandler');
const config = require('../config');

function keyEnvPrefix() {
  return config.isProduction ? 'live' : 'test';
}

function generateRawApiKey() {
  return `ff_${keyEnvPrefix()}_${crypto.randomBytes(24).toString('hex')}`;
}

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
}

function parseScopes(input) {
  if (!Array.isArray(input) || input.length === 0) return ['widget', 'sync'];
  const cleaned = input.map((item) => String(item || '').trim()).filter(Boolean);
  return [...new Set(cleaned)];
}

function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

async function generateApiKey(clientId, { name, scopes, expiresAt } = {}) {
  const rawKey = generateRawApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 14);

  const payload = {
    client_id: clientId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: name || 'Default key',
    scopes: parseScopes(scopes),
    is_active: true,
    expires_at: expiresAt || null,
  };

  const { data, error } = await supabase
    .from('api_keys')
    .insert(payload)
    .select('id, client_id, key_prefix, name, scopes, is_active, expires_at, created_at')
    .single();
  if (error) throw error;

  return { rawKey, key: data };
}

async function verifyApiKey(rawKey) {
  const keyValue = String(rawKey || '').trim();
  if (!keyValue) throw new ApiError(401, 'Missing X-API-Key header', 'API_KEY_MISSING');

  const keyHash = hashApiKey(keyValue);
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, client_id, key_prefix, scopes, is_active, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();
  if (error) throw error;

  if (!data) throw new ApiError(401, 'Invalid API key', 'API_KEY_INVALID');
  if (!data.is_active || data.revoked_at) throw new ApiError(401, 'API key revoked', 'API_KEY_REVOKED');
  if (isExpired(data.expires_at)) throw new ApiError(401, 'API key expired', 'API_KEY_EXPIRED');

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, status, plan')
    .eq('id', data.client_id)
    .maybeSingle();
  if (clientError) throw clientError;
  if (!client) throw new ApiError(401, 'Client not found for API key', 'API_KEY_CLIENT_MISSING');

  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})
    .catch(() => {});

  return {
    keyId: data.id,
    keyPrefix: data.key_prefix,
    clientId: client.id,
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    plan: client.plan,
    status: client.status,
  };
}

async function listApiKeys(clientId) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, scopes, is_active, last_used_at, expires_at, revoked_at, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function revokeApiKey(keyId, clientId, reason = null) {
  const { error } = await supabase
    .from('api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason || null,
    })
    .eq('id', keyId)
    .eq('client_id', clientId);
  if (error) throw error;
}

async function rotateApiKey(keyId, clientId, options = {}) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('api_keys')
    .update({
      expires_at: expiresAt,
      revoke_reason: 'rotated',
    })
    .eq('id', keyId)
    .eq('client_id', clientId)
    .eq('is_active', true);
  if (error) throw error;

  return generateApiKey(clientId, options);
}

module.exports = {
  generateApiKey,
  verifyApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
  hashApiKey,
};
