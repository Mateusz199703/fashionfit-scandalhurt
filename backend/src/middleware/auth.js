const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabase } = require('../services/supabase');
const { verifyApiKey } = require('../services/apiKeys');
const { isMockBackendEnabled, getMockClientByApiKey } = require('../services/mockStore');
const { getBlockState, registerFailure, clearFailures } = require('../services/apiKeyAbuseStore');
const { pickIp, logSecurityEvent } = require('../services/securityEvents');
const { ApiError } = require('./errorHandler');

// Dashboard auth: validates a JWT issued at login/registration.
function authenticateJWT(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Missing bearer token'));

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.clientId = payload.sub;
    req.client = payload;
    return next();
  } catch (e) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Public widget auth: validates the client's API key from the X-API-Key header.
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const ip = pickIp(req);
  const keyPrefix = String(apiKey || '').slice(0, 14) || 'missing';
  const block = getBlockState(ip, keyPrefix);
  if (block.blocked) {
    logSecurityEvent('api_key_blocked_request', req, {
      keyPrefix,
      retryAfterSec: block.retryAfterSec,
    });
    return next(new ApiError(429, `Too many invalid API key attempts. Try again in ${block.retryAfterSec}s`, 'API_KEY_TEMP_BLOCKED'));
  }

  if (!apiKey) {
    registerFailure(ip, keyPrefix);
    logSecurityEvent('api_key_missing', req, { keyPrefix });
    return next(new ApiError(401, 'Missing X-API-Key header'));
  }

  if (isMockBackendEnabled()) {
    const mockClient = getMockClientByApiKey(String(apiKey));
    if (!mockClient) {
      registerFailure(ip, keyPrefix);
      logSecurityEvent('api_key_invalid_mock', req, { keyPrefix });
      return next(new ApiError(401, 'Invalid API key'));
    }
    clearFailures(ip, keyPrefix);
    req.clientId = mockClient.id;
    req.client = { id: mockClient.id, status: mockClient.status, plan: mockClient.plan };
    return next();
  }

  try {
    const verified = await verifyApiKey(apiKey);
    clearFailures(ip, keyPrefix);
    req.clientId = verified.clientId;
    req.client = {
      id: verified.clientId,
      status: verified.status,
      plan: verified.plan,
    };
    req.apiKey = {
      id: verified.keyId,
      prefix: verified.keyPrefix,
      scopes: verified.scopes,
    };
    return next();
  } catch (err) {
    // Backward compatibility path: clients.api_key plaintext support.
    const { data, error } = await supabase
      .from('clients')
      .select('id, status, plan')
      .eq('api_key', String(apiKey))
      .maybeSingle();
    if (error) return next(error);
    if (!data) {
      registerFailure(ip, keyPrefix);
      logSecurityEvent('api_key_invalid', req, {
        keyPrefix,
        code: err && err.code ? err.code : null,
      });
      return next(err);
    }
    clearFailures(ip, keyPrefix);
    req.clientId = data.id;
    req.client = data;
    req.apiKey = { id: null, prefix: String(apiKey).slice(0, 14), scopes: ['widget', 'sync'] };
    return next();
  }
}

function requireScope(scope) {
  return (req, res, next) => {
    const scopes = req.apiKey && Array.isArray(req.apiKey.scopes) ? req.apiKey.scopes : [];
    if (!scopes.includes(scope)) {
      return next(new ApiError(403, `API key is missing required scope: ${scope}`, 'SCOPE_REQUIRED'));
    }
    return next();
  };
}

module.exports = { authenticateJWT, authenticateApiKey, requireScope };
