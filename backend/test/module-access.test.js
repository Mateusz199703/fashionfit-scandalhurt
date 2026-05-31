const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizePlan,
  getModuleAccessSnapshot,
  isModuleEnabled,
} = require('../src/services/moduleAccess');

function createDb({ tenantRows = [], shopRows = [] } = {}) {
  return {
    from(table) {
      assert.equal(table, 'module_access');
      const state = { shopId: undefined };

      const builder = {
        select() {
          return builder;
        },
        eq(column, value) {
          if (column === 'shop_id') state.shopId = value;
          return builder;
        },
        is(column, value) {
          if (column === 'shop_id' && value === null) {
            return Promise.resolve({ data: tenantRows, error: null });
          }
          return Promise.resolve({ data: [], error: null });
        },
        then(resolve, reject) {
          if (state.shopId !== undefined && state.shopId !== null) {
            return Promise.resolve({ data: shopRows, error: null }).then(resolve, reject);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        },
      };

      return builder;
    },
  };
}

test('normalizePlan falls back to STARTER for unknown values', () => {
  assert.equal(normalizePlan('growth'), 'GROWTH');
  assert.equal(normalizePlan('unknown-plan'), 'STARTER');
  assert.equal(normalizePlan(null), 'STARTER');
});

test('resolver applies precedence: shop override > tenant override > plan default', async () => {
  const db = createDb({
    tenantRows: [{ module_key: 'virtual_try_on', is_enabled: false, shop_id: null }],
    shopRows: [{ module_key: 'virtual_try_on', is_enabled: true, shop_id: 'shop-1' }],
  });

  const snapshot = await getModuleAccessSnapshot({
    clientId: '11111111-1111-1111-1111-111111111111',
    plan: 'STARTER',
    shopId: 'shop-1',
    ownershipChecker: async () => true,
    db,
  });

  const vto = snapshot.modules.find((m) => m.key === 'virtual_try_on');
  assert.equal(vto.enabled, true);
  assert.equal(vto.source, 'shop_override');
});

test('resolver rejects non-owned shop', async () => {
  await assert.rejects(
    () => getModuleAccessSnapshot({
      clientId: '11111111-1111-1111-1111-111111111111',
      plan: 'STARTER',
      shopId: 'shop-404',
      ownershipChecker: async () => false,
      db: createDb(),
    }),
    (err) => err && err.status === 403 && /Shop does not belong/.test(err.message),
  );
});

test('resolver fails closed on invalid module_access.module_key values', async () => {
  const db = createDb({
    tenantRows: [{ module_key: 'VIRTUAL_TRY_ON', is_enabled: false, shop_id: null }],
  });

  await assert.rejects(
    () => getModuleAccessSnapshot({
      clientId: '11111111-1111-1111-1111-111111111111',
      plan: 'STARTER',
      db,
    }),
    (err) => err && err.status === 500 && err.code === 'MODULE_ACCESS_INVALID_KEY',
  );
});

test('isModuleEnabled supports normalized key lookup and rejects unknown key', async () => {
  const db = createDb();
  const snapshot = await getModuleAccessSnapshot({
    clientId: '11111111-1111-1111-1111-111111111111',
    plan: 'STARTER',
    db,
  });

  assert.equal(isModuleEnabled(snapshot, 'virtual_try_on'), true);
  assert.equal(isModuleEnabled(snapshot, 'VIRTUAL_TRY_ON'), true);
  assert.equal(isModuleEnabled(snapshot, 'ai_stylist_advisor'), false);
  assert.throws(() => isModuleEnabled(snapshot, 'not_a_real_module'));
});
