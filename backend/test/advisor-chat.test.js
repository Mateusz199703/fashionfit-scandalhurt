const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildLockedModuleResponse,
  selectTopRecommendations,
  filterCatalogProducts,
  resolveConversation,
} = require('../src/services/advisor');

const CLIENT_ID = '11111111-1111-1111-1111-111111111111';
const SHOP_A = '22222222-2222-2222-2222-222222222222';
const SHOP_B = '33333333-3333-3333-3333-333333333333';

test('locked module response matches contract', () => {
  const response = buildLockedModuleResponse();
  assert.equal(response.code, 'MODULE_LOCKED');
  assert.equal(response.upgrade.requiredModule, 'ai_stylist_advisor');
  assert.equal(response.upgrade.action, 'upgrade_plan');
});

test('returns maximum 3 recommendations', () => {
  const products = [
    { id: 'p1', shop_id: SHOP_A, name: 'Sukienka letnia biala', category: 'one-pieces', variants: null, is_synced: true },
    { id: 'p2', shop_id: SHOP_A, name: 'Sukienka letnia czarna', category: 'one-pieces', variants: null, is_synced: true },
    { id: 'p3', shop_id: SHOP_A, name: 'Sukienka letnia midi', category: 'one-pieces', variants: null, is_synced: true },
    { id: 'p4', shop_id: SHOP_A, name: 'Sukienka letnia maxi', category: 'one-pieces', variants: null, is_synced: true },
    { id: 'p5', shop_id: SHOP_A, name: 'Sukienka letnia basic', category: 'one-pieces', variants: null, is_synced: true },
  ];

  const recommendations = selectTopRecommendations(products, 'sukienka letnia');
  assert.equal(recommendations.length, 3);
});

test('catalog-only filtering keeps only products from requested shop', () => {
  const products = [
    { id: 'a1', shop_id: SHOP_A, name: 'Sukienka na lato', category: 'one-pieces', is_synced: true },
    { id: 'b1', shop_id: SHOP_B, name: 'Sukienka premium', category: 'one-pieces', is_synced: true },
    { id: 'm1', name: 'Sukienka bez shop_id', category: 'one-pieces', is_synced: true },
    { id: 'a2', shop_id: SHOP_A, name: 'Spodnie', category: 'bottoms', is_synced: false },
  ];

  const filtered = filterCatalogProducts(products, SHOP_A);
  assert.deepEqual(filtered.map((p) => p.id), ['a1']);
});

test('cross-shop conversation access is blocked', async () => {
  const db = {
    from(table) {
      assert.equal(table, 'advisor_conversations');
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle() {
          return Promise.resolve({
            data: {
              id: '7b2db0e4-6f1d-4db8-b67b-6f5ddf4c2de2',
              client_id: CLIENT_ID,
              shop_id: SHOP_A,
            },
            error: null,
          });
        },
      };
    },
  };

  await assert.rejects(
    () => resolveConversation({
      db,
      clientId: CLIENT_ID,
      shopId: SHOP_B,
      conversationId: '7b2db0e4-6f1d-4db8-b67b-6f5ddf4c2de2',
    }),
    (err) => err && err.status === 403 && err.code === 'CONVERSATION_FORBIDDEN',
  );
});
