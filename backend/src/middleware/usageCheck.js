const config = require('../config');
const { supabase } = require('../services/supabase');
const { ApiError } = require('./errorHandler');

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function checkUsageQuota(req, res, next) {
  const clientId = req.clientId;
  const clientPlan = req.client && req.client.plan ? req.client.plan : 'STARTER';
  const limit = config.planLimits[clientPlan] || 0;

  if (!clientId || limit <= 0) return next();

  const { data: shops, error: shopsError } = await supabase
    .from('shops')
    .select('id')
    .eq('client_id', clientId);
  if (shopsError) return next(shopsError);

  const shopIds = (shops || []).map((s) => s.id);
  if (shopIds.length === 0) return next();

  const { count, error: countError } = await supabase
    .from('tryon_sessions')
    .select('id', { count: 'exact', head: true })
    .in('shop_id', shopIds)
    .gte('created_at', monthStartIso());
  if (countError) return next(countError);

  const used = count || 0;
  if (used >= limit) {
    return next(new ApiError(429, `Plan quota exceeded (${used}/${limit}). Upgrade your plan to continue.`, 'QUOTA_EXCEEDED'));
  }

  req.usage = { used, limit };
  return next();
}

module.exports = { checkUsageQuota };
