const { ApiError } = require('../middleware/errorHandler');
const { MODULE_CATALOG, MODULE_KEYS, PLAN_MODULE_ACCESS } = require('./moduleCatalog');

function getDefaultDb() {
  return require('./supabase').supabase;
}

function normalizeModuleKey(input) {
  return String(input || '').trim().toLowerCase();
}

function isKnownCanonicalModuleKey(moduleKey) {
  return MODULE_KEYS.includes(moduleKey);
}

function assertValidOverrideModuleKey(rawModuleKey) {
  const normalized = normalizeModuleKey(rawModuleKey);
  const raw = String(rawModuleKey == null ? '' : rawModuleKey);
  const isCanonical = raw === normalized;
  const isKnown = isKnownCanonicalModuleKey(normalized);

  if (!isCanonical || !isKnown) {
    throw new ApiError(
      500,
      `Invalid module_access.module_key value: ${raw || '<empty>'}`,
      'MODULE_ACCESS_INVALID_KEY',
    );
  }

  return normalized;
}

function normalizePlan(plan) {
  const candidate = String(plan || '').trim().toUpperCase();
  return PLAN_MODULE_ACCESS[candidate] ? candidate : 'STARTER';
}

function createPlanMap(plan) {
  const normalizedPlan = normalizePlan(plan);
  const defaults = PLAN_MODULE_ACCESS[normalizedPlan] || PLAN_MODULE_ACCESS.STARTER;
  const map = {};

  for (const key of MODULE_KEYS) {
    map[key] = {
      enabled: Boolean(defaults[key]),
      source: 'plan',
    };
  }

  return { normalizedPlan, map };
}

function applyOverrides(targetMap, rows, source) {
  for (const row of rows || []) {
    const moduleKey = assertValidOverrideModuleKey(row && row.module_key);
    targetMap[moduleKey] = {
      enabled: Boolean(row.is_enabled),
      source,
    };
  }
}

async function fetchModuleAccessRows({ clientId, shopId = null, db }) {
  const activeDb = db || getDefaultDb();
  const { data: tenantRows, error: tenantError } = await activeDb
    .from('module_access')
    .select('module_key, is_enabled, shop_id')
    .eq('client_id', clientId)
    .is('shop_id', null);
  if (tenantError) throw tenantError;

  if (!shopId) {
    return {
      tenantRows: tenantRows || [],
      shopRows: [],
    };
  }

  const { data: shopRows, error: shopError } = await activeDb
    .from('module_access')
    .select('module_key, is_enabled, shop_id')
    .eq('client_id', clientId)
    .eq('shop_id', shopId);
  if (shopError) throw shopError;

  return {
    tenantRows: tenantRows || [],
    shopRows: shopRows || [],
  };
}

async function assertShopOwnership(shopId, clientId, ownershipChecker) {
  if (!shopId) throw new ApiError(400, 'shopId is required');
  const checker = ownershipChecker || require('./ownership').isShopOwnedByClient;
  const owned = await checker(shopId, clientId);
  if (!owned) throw new ApiError(403, 'Shop does not belong to this client');
}

async function getModuleAccessSnapshot({ clientId, plan, shopId = null, db, ownershipChecker }) {
  const activeDb = db || getDefaultDb();
  if (!clientId) throw new ApiError(400, 'clientId is required');
  if (shopId) await assertShopOwnership(shopId, clientId, ownershipChecker);

  const { normalizedPlan, map } = createPlanMap(plan);
  const { tenantRows, shopRows } = await fetchModuleAccessRows({ clientId, shopId, db: activeDb });

  applyOverrides(map, tenantRows, 'tenant_override');
  applyOverrides(map, shopRows, 'shop_override');

  const modules = MODULE_CATALOG.map((entry) => ({
    key: entry.key,
    label: entry.label,
    description: entry.description,
    enabled: map[entry.key].enabled,
    source: map[entry.key].source,
  }));

  return {
    plan: normalizedPlan,
    shopId: shopId || null,
    modules,
  };
}

function isModuleEnabled(snapshot, moduleKey) {
  const key = normalizeModuleKey(moduleKey);
  if (!isKnownCanonicalModuleKey(key)) {
    throw new ApiError(400, `Unknown module key: ${key || '<empty>'}`);
  }
  const row = (snapshot.modules || []).find((item) => item.key === key);
  return Boolean(row && row.enabled);
}

module.exports = {
  normalizePlan,
  fetchModuleAccessRows,
  getModuleAccessSnapshot,
  isModuleEnabled,
  assertShopOwnership,
};
