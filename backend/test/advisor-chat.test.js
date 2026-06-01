const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RESPONSE_TYPES,
  buildLockedModuleResponse,
  selectTopRecommendations,
  filterCatalogProducts,
  resolveConversation,
  resolveAdvisorOutcome,
  buildSuccessResponse,
  hasShoppingIntent,
} = require('../src/services/advisor');
const config = require('../src/config');

const CLIENT_ID = '11111111-1111-1111-1111-111111111111';
const SHOP_A = '22222222-2222-2222-2222-222222222222';
const SHOP_B = '33333333-3333-3333-3333-333333333333';

function buildCatalog(items) {
  return items.map((item, idx) => ({
    id: item.id,
    shop_id: item.shop_id || SHOP_A,
    external_id: item.external_id || String(idx + 1),
    name: item.name,
    category: item.category || 'one-pieces',
    is_synced: item.is_synced !== false,
    created_at: item.created_at || `2026-06-01T00:00:${String(10 + idx).padStart(2, '0')}.000Z`,
    product_url: item.product_url || null,
    garment_image_url: item.garment_image_url || null,
    variants: item.variants || null,
  }));
}

test('locked module response matches contract', () => {
  const response = buildLockedModuleResponse();
  assert.equal(response.code, 'MODULE_LOCKED');
  assert.equal(response.upgrade.requiredModule, 'ai_stylist_advisor');
  assert.equal(response.upgrade.action, 'upgrade_plan');
});

test('returns maximum 3 deterministic recommendations', () => {
  const products = buildCatalog([
    { id: 'p1', name: 'Sukienka letnia biala' },
    { id: 'p2', name: 'Sukienka letnia czarna' },
    { id: 'p3', name: 'Sukienka letnia midi' },
    { id: 'p4', name: 'Sukienka letnia maxi' },
  ]);

  const recommendations = selectTopRecommendations(products, 'sukienka letnia');
  assert.equal(recommendations.length, 3);
});

test('shopping intent detection distinguishes broad styling from shopping query', () => {
  assert.equal(hasShoppingIntent('co pasuje do brunetek?'), false);
  assert.equal(hasShoppingIntent('czy znajdę tu dresy?'), true);
  assert.equal(hasShoppingIntent('pokaż co macie w ofercie'), false);
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

test('general styling advice returns advice-oriented responseType and no recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'co pasuje brunetce?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'answer_only',
        reply: 'Brunetkom pasują głębokie kolory. Wolisz bardziej elegancki czy casualowy efekt?',
        recommendedProductIds: [],
        followUpQuestion: 'Wolisz elegancki czy casualowy efekt?',
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'answer_only');
  assert.equal(result.recommendations.length, 0);
});

test('color advice returns advice-only response with zero recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'jakie kolory pasują do brunetek?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'answer_only');
  assert.equal(result.recommendations.length, 0);
  assert.doesNotMatch(result.reply, /nie widzę teraz pasujących produktów/i);
});

test('general styling fallback is human-like when AI is unavailable', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'co pasuje brunetce?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'answer_only');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply.toLowerCase(), /brunetk|kolor|granat|bordo|zieleń|zielen/u);
});

test('vague request returns follow-up guidance without random products', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'potrzebuję czegoś fajnego',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka letnia' },
      { id: 'a2', name: 'Bluzka satynowa' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'ask_follow_up',
        reply: 'Jasne, na jaką okazję i w jakim stylu szukasz czegoś fajnego?',
        recommendedProductIds: [],
        followUpQuestion: 'Na jaką okazję?',
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'ask_follow_up');
  assert.equal(result.recommendations.length, 0);
});

test('no dresy in catalog returns no_match and no unrelated products', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy są dresy?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka letnia', category: 'one-pieces' },
      { id: 'a2', name: 'Bluzka satynowa', category: 'tops' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'recommend_products',
        reply: 'Sprawdź te propozycje.',
        recommendedProductIds: ['a1'],
        selectionReasons: [{ productId: 'a1', reason: 'Uniwersalny wybór.' }],
      }),
    },
  });

  assert.equal(result.responseType, 'no_match');
  assert.equal(result.recommendations.length, 0);
});

test('AI no_match response keeps natural AI reply with empty recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy są dresy?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka letnia', category: 'one-pieces' },
      { id: 'a2', name: 'Bluzka satynowa', category: 'tops' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'no_match',
        reply: 'Nie widzę obecnie dresów w tym katalogu, ale mogę pokazać Ci np. wygodne komplety casual.',
        recommendedProductIds: [],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'no_match');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę obecnie dresów/i);
});

test('product search with relevant match returns validated recommendations and max 3', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'szukam sukienki na wesele',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka satynowa midi', category: 'one-pieces' },
      { id: 'a2', name: 'Sukienka koktajlowa', category: 'one-pieces' },
      { id: 'a3', name: 'Sukienka wieczorowa', category: 'one-pieces' },
      { id: 'a4', name: 'Kombinezon elegancki', category: 'one-pieces' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'recommend_products',
        reply: 'Mam kilka propozycji na wesele.',
        recommendedProductIds: ['a3', 'a2', 'a1', 'a4'],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'recommend_products');
  assert.equal(result.recommendations.length, 3);
  assert.deepEqual(result.recommendations.map((item) => item.productId), ['a3', 'a2', 'a1']);
});

test('browse_catalog returns up to 3 representative products without previous query dependency', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'pokaż co macie w ofercie',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka satynowa midi', category: 'one-pieces' },
      { id: 'a2', name: 'Bluzka jedwabna', category: 'tops' },
      { id: 'a3', name: 'Spodnie palazzo', category: 'bottoms' },
      { id: 'a4', name: 'Kardigan premium', category: 'outerwear' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [{ role: 'assistant', content: 'Brak dopasowanych produktów.' }],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'browse_catalog',
        reply: 'Pewnie, oto kilka propozycji z oferty.',
        recommendedProductIds: ['a2', 'a1', 'a3'],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'browse_catalog');
  assert.equal(result.recommendations.length, 3);
  assert.deepEqual(result.recommendations.map((item) => item.productId), ['a2', 'a1', 'a3']);
});

test('empty catalog + browse_catalog returns clear empty response and no recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'co macie w sklepie?',
    shopId: SHOP_A,
    catalogProducts: [],
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'browse_catalog');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę jeszcze produktów|nie widze jeszcze produktow/i);
});

test('previous no_match then browse request recovers to browse_catalog', async () => {
  const catalog = buildCatalog([
    { id: 'a1', name: 'Sukienka satynowa midi', category: 'one-pieces' },
    { id: 'a2', name: 'Bluzka jedwabna', category: 'tops' },
    { id: 'a3', name: 'Spodnie palazzo', category: 'bottoms' },
  ]);

  const first = await resolveAdvisorOutcome({
    message: 'czy są dresy?',
    shopId: SHOP_A,
    catalogProducts: catalog,
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  const second = await resolveAdvisorOutcome({
    message: 'to pokaż coś z oferty',
    shopId: SHOP_A,
    catalogProducts: catalog,
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [
      { role: 'user', content: 'czy są dresy?' },
      { role: 'assistant', content: first.reply },
    ],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(first.responseType, 'no_match');
  assert.equal(second.responseType, 'browse_catalog');
  assert.ok(second.recommendations.length > 0);
});

test('AI unknown product IDs are rejected from recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'szukam sukienki',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka letnia' },
      { id: 'a2', name: 'Sukienka midi' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'recommend_products',
        reply: 'Proponuję te produkty.',
        recommendedProductIds: ['unknown', 'a1', 'b2'],
        selectionReasons: [{ productId: 'a1', reason: 'Dobre dopasowanie.' }],
      }),
    },
  });

  assert.equal(result.responseType, 'recommend_products');
  assert.deepEqual(result.recommendations.map((item) => item.productId), ['a1']);
});

test('OpenAI unavailable fallback remains fail-closed with safe response types', async () => {
  const originalAdvisorAiConfig = { ...config.advisorAi };
  config.advisorAi.enabled = true;
  config.advisorAi.apiKey = '';

  try {
    const noMatch = await resolveAdvisorOutcome({
      message: 'czy są dresy?',
      shopId: SHOP_A,
      catalogProducts: buildCatalog([
        { id: 'a1', name: 'Sukienka letnia' },
      ]),
      advisorSettings: { maxRecommendations: 3 },
      conversationMessages: [],
    });

    const browse = await resolveAdvisorOutcome({
      message: 'pokaż co macie w ofercie',
      shopId: SHOP_A,
      catalogProducts: buildCatalog([
        { id: 'a1', name: 'Sukienka letnia' },
        { id: 'a2', name: 'Bluzka satynowa', category: 'tops' },
      ]),
      advisorSettings: { maxRecommendations: 3 },
      conversationMessages: [],
    });

    assert.equal(noMatch.responseType, 'no_match');
    assert.equal(noMatch.recommendations.length, 0);
    assert.equal(browse.responseType, 'browse_catalog');
    assert.ok(browse.recommendations.length > 0);
    assert.ok(browse.recommendations.length <= 3);
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

test('buildSuccessResponse includes stable responseType in meta', () => {
  const response = buildSuccessResponse({
    conversationId: '00000000-0000-4000-8000-000000000001',
    assistantMessageId: '00000000-0000-4000-8000-000000000002',
    shopId: SHOP_A,
    recommendations: [],
    reply: 'Odpowiedź bez produktów.',
    maxResults: 3,
    responseType: 'answer_only',
  });

  assert.equal(response.meta.module, 'ai_stylist_advisor');
  assert.equal(response.meta.responseType, 'answer_only');
  assert.ok(RESPONSE_TYPES.includes(response.meta.responseType));
});
