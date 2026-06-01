const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAdvisorRouter } = require('../src/routes/advisor');

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
const SHOP_ROUTE_VALID = '22222222-2222-4222-8222-222222222222';

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
    price: item.price != null ? item.price : null,
    regular_price: item.regular_price != null ? item.regular_price : null,
    sale_price: item.sale_price != null ? item.sale_price : null,
    currency: item.currency || null,
    stock_status: item.stock_status || null,
    stock_quantity: item.stock_quantity != null ? item.stock_quantity : null,
    is_in_stock: item.is_in_stock != null ? item.is_in_stock : null,
    attributes: item.attributes || null,
    colors: item.colors || null,
    sizes: item.sizes || null,
    material: item.material || null,
    description: item.description || null,
    short_description: item.short_description || null,
    tags: item.tags || null,
    gallery_images: item.gallery_images || null,
    source_updated_at: item.source_updated_at || null,
  }));
}

async function requestAdvisorChat(router, body) {
  const app = express();
  app.use(express.json());
  app.use('/api/advisor', router);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/advisor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  await new Promise((resolve) => server.close(resolve));
  return { status: response.status, payload };
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

test('price question with missing price returns safe missing-data reply and no recommendations', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'ile kosztuje ta sukienka?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'product_explanation',
        reply: 'Kosztuje 199 PLN.',
        recommendedProductIds: [],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_price');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę jeszcze ceny|nie widze jeszcze ceny/i);
});

test('sale/regular price question uses real catalog values when available', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'ile kosztuje ta sukienka?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{
      id: 'a1',
      name: 'Sukienka premium',
      sale_price: 179.9,
      regular_price: 249.9,
      currency: 'PLN',
    }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'product_explanation',
        reply: 'Kosztuje 150 PLN.',
        recommendedProductIds: [],
        selectionReasons: [],
      }),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_price');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply.toLowerCase(), /promocji 179\.90 pln/i);
  assert.match(result.reply.toLowerCase(), /regularna 249\.90 pln/i);
});

test('size question without reliable availability returns safe missing-data reply', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy jest rozmiar M?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia', variants: null }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_variant_question');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę jeszcze dokładnej dostępności rozmiaru m|nie widze jeszcze dokladnej dostepnosci rozmiaru m/i);
});

test('size question uses sizes data when available', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy jest rozmiar M?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia', sizes: ['S', 'M', 'L'] }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_variant_question');
  assert.match(result.reply.toLowerCase(), /widzę rozmiar m|widze rozmiar m/i);
});

test('color question with missing color facts returns safe missing-data reply', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'jakie kolory są dostępne?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia', variants: { sizes: ['S', 'M'] } }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_attribute_question');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę jeszcze informacji o dostępnych kolorach|nie widze jeszcze informacji o dostepnych kolorach/i);
});

test('color question uses colors data when available', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'jakie kolory są dostępne?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia', colors: ['Czarny', 'Granat'] }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_attribute_question');
  assert.match(result.reply.toLowerCase(), /czarny/);
  assert.match(result.reply.toLowerCase(), /granat/);
});

test('stock question uses stock fields when available', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy ten produkt jest dostępny na stanie?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{
      id: 'a1',
      name: 'Sukienka letnia',
      stock_status: 'instock',
      stock_quantity: 8,
      is_in_stock: true,
    }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_availability');
  assert.match(result.reply.toLowerCase(), /dostępny|dostepny/);
  assert.match(result.reply.toLowerCase(), /8/);
});

test('product explanation for summer remains stylistic without inventing material or stock', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy ten produkt nada się na lato?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka midi', category: 'one-pieces' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_details');
  assert.equal(result.recommendations.length, 0);
  assert.doesNotMatch(result.reply.toLowerCase(), /bawełna|wiskoza|100%|na stanie|dostępny magazynowo/);
});

test('material question uses real material field when available', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'z jakiego materiału jest ten produkt?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka midi', material: 'Wiskoza' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => false,
      getStylistResponse: async () => ({}),
    },
  });

  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.intentSubtype, 'product_details');
  assert.match(result.reply.toLowerCase(), /wiskoza/);
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

test('black dresses query returns no_match when no reliable black match exists', async () => {
  const result = await resolveAdvisorOutcome({
    message: 'czy macie czarne sukienki?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([
      { id: 'a1', name: 'Sukienka letnia kremowa', category: 'one-pieces' },
      { id: 'a2', name: 'Sukienka midi beżowa', category: 'one-pieces' },
    ]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'recommend_products',
        reply: 'Sprawdź te dwie propozycje.',
        recommendedProductIds: ['a1', 'a2'],
        selectionReasons: [],
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

test('fact question does not expose invented AI price/size/color/stock claims', async () => {
  let aiCalled = false;
  const result = await resolveAdvisorOutcome({
    message: 'ile kosztuje ta sukienka?',
    shopId: SHOP_A,
    catalogProducts: buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]),
    advisorSettings: { maxRecommendations: 3 },
    conversationMessages: [],
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => {
        aiCalled = true;
        return {
          responseType: 'product_explanation',
          reply: 'Cena to 129 PLN, dostępny rozmiar M i kolor czarny.',
          recommendedProductIds: [],
          selectionReasons: [],
        };
      },
    },
  });

  assert.equal(aiCalled, false);
  assert.equal(result.responseType, 'product_explanation');
  assert.equal(result.recommendations.length, 0);
  assert.match(result.reply, /nie widzę jeszcze ceny|nie widze jeszcze ceny/i);
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

test('advisor route response includes meta.intentSubtype=product_price for missing price question', async () => {
  const catalog = buildCatalog([{ id: 'a1', name: 'Sukienka letnia' }]);
  const router = createAdvisorRouter({
    authMiddleware: (req, res, next) => {
      req.clientId = CLIENT_ID;
      req.client = { id: CLIENT_ID, plan: 'GROWTH' };
      next();
    },
    useMockBackend: true,
    getMockShopFn: (shopId, clientId) => (String(shopId) === String(SHOP_ROUTE_VALID) && String(clientId) === String(CLIENT_ID)
      ? { id: SHOP_ROUTE_VALID, client_id: CLIENT_ID, widget_config: {} }
      : null),
    listMockProductsFn: (shopId, clientId) => (String(shopId) === String(SHOP_ROUTE_VALID) && String(clientId) === String(CLIENT_ID)
      ? catalog
      : null),
    getModuleAccessSnapshotFn: async () => ({ modules: [{ key: 'ai_stylist_advisor', enabled: true }] }),
    isModuleEnabledFn: () => true,
    mockState: { conversations: new Map(), messages: [] },
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'product_explanation',
        reply: 'Cena to 199 PLN.',
        recommendedProductIds: [],
        selectionReasons: [],
      }),
    },
  });

  const result = await requestAdvisorChat(router, {
    shopId: SHOP_ROUTE_VALID,
    message: 'ile kosztuje ta sukienka?',
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.meta.responseType, 'product_explanation');
  assert.equal(result.payload.meta.intentSubtype, 'product_price');
  assert.equal(Array.isArray(result.payload.recommendations), true);
  assert.equal(result.payload.recommendations.length, 0);
});

test('advisor route response includes meta.intentSubtype=product_variant_question for size question', async () => {
  const catalog = buildCatalog([{ id: 'a1', name: 'Sukienka letnia', variants: null }]);
  const router = createAdvisorRouter({
    authMiddleware: (req, res, next) => {
      req.clientId = CLIENT_ID;
      req.client = { id: CLIENT_ID, plan: 'GROWTH' };
      next();
    },
    useMockBackend: true,
    getMockShopFn: (shopId, clientId) => (String(shopId) === String(SHOP_ROUTE_VALID) && String(clientId) === String(CLIENT_ID)
      ? { id: SHOP_ROUTE_VALID, client_id: CLIENT_ID, widget_config: {} }
      : null),
    listMockProductsFn: (shopId, clientId) => (String(shopId) === String(SHOP_ROUTE_VALID) && String(clientId) === String(CLIENT_ID)
      ? catalog
      : null),
    getModuleAccessSnapshotFn: async () => ({ modules: [{ key: 'ai_stylist_advisor', enabled: true }] }),
    isModuleEnabledFn: () => true,
    mockState: { conversations: new Map(), messages: [] },
    aiClient: {
      isEnabled: () => true,
      getStylistResponse: async () => ({
        responseType: 'product_explanation',
        reply: 'Rozmiar M jest dostępny.',
        recommendedProductIds: [],
        selectionReasons: [],
      }),
    },
  });

  const result = await requestAdvisorChat(router, {
    shopId: SHOP_ROUTE_VALID,
    message: 'czy jest rozmiar M?',
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.meta.responseType, 'product_explanation');
  assert.equal(result.payload.meta.intentSubtype, 'product_variant_question');
  assert.equal(Array.isArray(result.payload.recommendations), true);
  assert.equal(result.payload.recommendations.length, 0);
});
