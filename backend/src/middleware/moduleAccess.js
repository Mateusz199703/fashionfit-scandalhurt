const { ApiError } = require('./errorHandler');
const { getModuleAccessSnapshot, isModuleEnabled } = require('../services/moduleAccess');

function pickShopId(req, options = {}) {
  const fromOption = options.shopId;
  if (typeof fromOption === 'function') return fromOption(req);
  if (fromOption !== undefined) return fromOption;

  const fromParams = options.shopIdParam && req.params ? req.params[options.shopIdParam] : null;
  if (fromParams) return fromParams;

  const fromQuery = options.shopIdQuery && req.query ? req.query[options.shopIdQuery] : null;
  if (fromQuery) return fromQuery;

  const fromBody = options.shopIdBody && req.body ? req.body[options.shopIdBody] : null;
  if (fromBody) return fromBody;

  return null;
}

function isShopScopeExpected(options = {}) {
  if (options.requireShopContext === true) return true;
  if (options.shopScoped === true) return true;
  if (typeof options.shopId === 'function') return true;
  if (options.shopId != null) return true;
  if (options.shopIdParam) return true;
  if (options.shopIdQuery) return true;
  if (options.shopIdBody) return true;
  return false;
}

function requireModuleAccess(moduleKey, options = {}) {
  const key = String(moduleKey || '').trim();
  if (!key) throw new ApiError(500, 'moduleKey is required for module access middleware');

  return async (req, res, next) => {
    try {
      const shopId = pickShopId(req, options);
      const expectsShopScope = isShopScopeExpected(options);
      if (expectsShopScope && !shopId) {
        throw new ApiError(400, 'shopId is required for shop-scoped module access checks', 'SHOP_ID_REQUIRED');
      }
      const plan = req.client && req.client.plan ? req.client.plan : null;

      const snapshot = await getModuleAccessSnapshot({
        clientId: req.clientId,
        plan,
        shopId,
      });

      req.moduleAccess = snapshot;

      if (!isModuleEnabled(snapshot, key)) {
        throw new ApiError(403, `Module is disabled: ${key}`, 'MODULE_DISABLED');
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  requireModuleAccess,
};
