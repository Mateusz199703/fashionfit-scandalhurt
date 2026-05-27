const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabase } = require('../services/supabase');
const { verifyApiKey } = require('../services/apiKeys');
const { isMockBackendEnabled, getMockClientByApiKey } = require('../services/mockStore');
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
  if (!apiKey) return next(new ApiError(401, 'Missing X-API-Key header'));

  if (isMockBackendEnabled()) {
    const mockClient = getMockClientByApiKey(String(apiKey));
    if (!mockClient) return next(new ApiError(401, 'Invalid API key'));
    req.clientId = mockClient.id;
    req.client = { id: mockClient.id, status: mockClient.status, plan: mockClient.plan };
    return next();
  }

  try {
    const verified = await verifyApiKey(apiKey);
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
    if (!data) return next(err);
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
