const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildLockedModuleResponse,
  selectTopRecommendations,
  filterCatalogProducts,
  resolveConversation,
  resolveAdvisorOutcome,
  buildSuccessResponse,
} = require('../src/services/advisor');
const config = require('../src/config');

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

test('AI disabled uses deterministic fallback', async () => {
  const catalogProducts = [
    { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
  ];

  const result = await resolveAdvisorOutcome({
    message: 'Szukam sukienki',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => {
        throw new Error('should not be called');
      },
    },
  });

  assert.equal(result.usedAi, false);
  assert.equal(result.recommendations.length, 1);
  assert.match(result.reply, /katalogu sklepu/i);
});

test('valid AI structured output returns natural reply and valid recommendations', async () => {
  const catalogProducts = [
    { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
    { id: 'a2', shop_id: SHOP_A, external_id: '2', name: 'Sukienka koktajlowa', category: 'one-pieces', is_synced: true },
  ];

  const result = await resolveAdvisorOutcome({
    message: 'Szukam eleganckiej sukienki na wesele',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { tone: 'luxury', maxRecommendations: 3 },
    conversationMessages: [{ role: 'user', content: 'Lubię klasykę.' }],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        reply: 'Mam dla Ciebie eleganckie propozycje na wesele.',
        selectedProductIds: ['a2', 'a1'],
        selectionReasons: [
          { productId: 'a2', reason: 'Bardziej formalny charakter.' },
          { productId: 'a1', reason: 'Lżejsza opcja na ciepły dzień.' },
        ],
      }),
    },
  });

  assert.equal(result.usedAi, true);
  assert.equal(result.reply, 'Mam dla Ciebie eleganckie propozycje na wesele.');
  assert.deepEqual(result.recommendations.map((item) => item.productId), ['a2', 'a1']);
});

test('malformed AI output triggers deterministic fallback', async () => {
  const catalogProducts = [
    { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
  ];

  const result = await resolveAdvisorOutcome({
    message: 'Szukam sukienki',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({ invalid: true }),
    },
  });

  assert.equal(result.usedAi, false);
  assert.equal(result.recommendations.length, 1);
});

test('AI-selected unknown or cross-shop product IDs are rejected', async () => {
  const catalogProducts = [
    { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
    { id: 'a2', shop_id: SHOP_A, external_id: '2', name: 'Sukienka midi', category: 'one-pieces', is_synced: true },
  ];

  const result = await resolveAdvisorOutcome({
    message: 'Szukam sukienki',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        reply: 'Proponuję te produkty.',
        selectedProductIds: ['unknown-id', 'a1', 'a1', 'b1'],
        selectionReasons: [{ productId: 'a1', reason: 'Dobre dopasowanie.' }],
      }),
    },
  });

  assert.equal(result.usedAi, true);
  assert.deepEqual(result.recommendations.map((item) => item.productId), ['a1']);
});

test('max recommendations is clamped to 1..3', async () => {
  const catalogProducts = [
    { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
    { id: 'a2', shop_id: SHOP_A, external_id: '2', name: 'Sukienka midi', category: 'one-pieces', is_synced: true },
    { id: 'a3', shop_id: SHOP_A, external_id: '3', name: 'Sukienka maxi', category: 'one-pieces', is_synced: true },
    { id: 'a4', shop_id: SHOP_A, external_id: '4', name: 'Sukienka wieczorowa', category: 'one-pieces', is_synced: true },
  ];

  const resultHigh = await resolveAdvisorOutcome({
    message: 'Szukam sukienki',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { maxRecommendations: 99 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        reply: 'Oto propozycje.',
        selectedProductIds: ['a1', 'a2', 'a3', 'a4'],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(resultHigh.maxRecommendations, 3);
  assert.equal(resultHigh.recommendations.length, 3);

  const resultLow = await resolveAdvisorOutcome({
    message: 'Szukam sukienki',
    shopId: SHOP_A,
    catalogProducts,
    advisorSettings: { maxRecommendations: 0 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        reply: 'Oto jedna propozycja.',
        selectedProductIds: ['a1', 'a2'],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(resultLow.maxRecommendations, 1);
  assert.equal(resultLow.recommendations.length, 1);
});

test('ADVISOR_AI_ENABLED=true with missing OPENAI_API_KEY uses deterministic fallback and stable contract', async () => {
  const originalAdvisorAiConfig = { ...config.advisorAi };
  config.advisorAi.enabled = true;
  config.advisorAi.apiKey = '';

  try {
    const catalogProducts = [
      { id: 'a1', shop_id: SHOP_A, external_id: '1', name: 'Sukienka letnia', category: 'one-pieces', is_synced: true },
    ];

    const outcome = await resolveAdvisorOutcome({
      message: 'Szukam sukienki',
      shopId: SHOP_A,
      catalogProducts,
      advisorSettings: { maxRecommendations: 3 },
      conversationMessages: [],
    });

    assert.equal(outcome.usedAi, false);
    assert.equal(outcome.recommendations.length, 1);
    assert.equal(typeof outcome.reply, 'string');

    const response = buildSuccessResponse({
      conversationId: '00000000-0000-4000-8000-000000000001',
      assistantMessageId: '00000000-0000-4000-8000-000000000002',
      shopId: SHOP_A,
      recommendations: outcome.recommendations,
      reply: outcome.reply,
      maxResults: outcome.maxRecommendations,
    });

    assert.equal(response.meta.module, 'ai_stylist_advisor');
    assert.equal(response.meta.maxResults, 3);
    assert.equal(response.meta.resultCount, 1);
    assert.equal(typeof response.reply, 'string');
    assert.ok(Array.isArray(response.recommendations));
  } finally {
    config.advisorAi.enabled = originalAdvisorAiConfig.enabled;
    config.advisorAi.apiKey = originalAdvisorAiConfig.apiKey;
    config.advisorAi.model = originalAdvisorAiConfig.model;
    config.advisorAi.baseUrl = originalAdvisorAiConfig.baseUrl;
    config.advisorAi.timeoutMs = originalAdvisorAiConfig.timeoutMs;
    config.advisorAi.maxOutputTokens = originalAdvisorAiConfig.maxOutputTokens;
    config.advisorAi.temperature = originalAdvisorAiConfig.temperature;
  }
});
