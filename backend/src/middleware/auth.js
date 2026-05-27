const jwt = require('jsonwebtoken');
const config = require('../config');
const { supabase } = require('../services/supabase');
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

  const { data, error } = await supabase
    .from('clients')
    .select('id, status, plan')
    .eq('api_key', apiKey)
    .maybeSingle();
  if (error) return next(error);
  if (!data) return next(new ApiError(401, 'Invalid API key'));

  req.clientId = data.id;
  req.client = data;
  return next();
}

module.exports = { authenticateJWT, authenticateApiKey };
