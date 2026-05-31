const { ApiError } = require('../middleware/errorHandler');

const MAX_RECOMMENDATIONS = 3;
const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_TONE = 'friendly';
const SHOPPING_INTENT_TERMS = [
  'szukam',
  'szukamy',
  'kup',
  'kupi',
  'kupić',
  'zamówi',
  'chcę',
  'chce',
  'potrzebuję',
  'potrzebuje',
  'znajdę',
  'znajde',
  'macie',
  'czy są',
  'czy sa',
  'pokaż',
  'pokaz',
  'produkt',
  'produkty',
];
const STYLING_INTENT_TERMS = [
  'co pasuje',
  'jaki kolor',
  'jaka stylizacja',
  'co ubrać',
  'co ubrac',
  'na wesele',
  'na komunię',
  'na komunie',
  'do brunetek',
  'do blondynek',
  'jak łączyć',
  'jak laczyc',
];

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function tokenizeMessage(input) {
  return String(input || '')
    .toLowerCase()
    .split(/[\s,.;:!?()\[\]{}"'`]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function buildTokenVariants(token) {
  const base = String(token || '').trim().toLowerCase();
  if (!base) return [];
  const variants = new Set([base]);

  const singularHints = [
    [/(ki|gi)$/u, 'ka'],
    [/ów$/u, ''],
    [/(ami|ach|owej|owego|owym|owych|ego|emu|ie|om|mi)$/u, ''],
    [/(a|e|ę|i|y|u)$/u, ''],
  ];

  for (const [pattern, replacement] of singularHints) {
    const next = base.replace(pattern, replacement).trim();
    if (next.length >= 3) variants.add(next);
  }

  return [...variants].filter((value) => value.length >= 2);
}

function hasShoppingIntent(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  return SHOPPING_INTENT_TERMS.some((term) => text.includes(term));
}

function hasStylingIntent(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  return STYLING_INTENT_TERMS.some((term) => text.includes(term));
}

function clampRecommendationLimit(value) {
  if (!Number.isFinite(Number(value))) return MAX_RECOMMENDATIONS;
  return Math.min(MAX_RECOMMENDATIONS, Math.max(1, Math.round(Number(value))));
}

function normalizeAdvisorSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const toneRaw = String(source.tone || '').trim().toLowerCase();
  const tone = ['friendly', 'neutral', 'luxury'].includes(toneRaw) ? toneRaw : DEFAULT_TONE;
  const welcomeMessage = typeof source.welcomeMessage === 'string' ? source.welcomeMessage.slice(0, 300) : '';
  const maxRecommendations = clampRecommendationLimit(source.maxRecommendations);

  return {
    tone,
    welcomeMessage,
    maxRecommendations,
  };
}

function validateAdvisorChatPayload(body) {
  const payload = body || {};
  const shopId = payload.shopId;
  const messageRaw = payload.message;
  const conversationId = payload.conversationId;

  if (!shopId) throw new ApiError(400, 'shopId is required', 'VALIDATION_ERROR');
  if (!isValidUuid(shopId)) throw new ApiError(400, 'shopId must be a valid UUID', 'VALIDATION_ERROR');

  if (typeof messageRaw !== 'string') {
    throw new ApiError(400, 'message is required', 'VALIDATION_ERROR');
  }

  const message = messageRaw.trim();
  if (!message) throw new ApiError(400, 'message is required', 'VALIDATION_ERROR');
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `message must be at most ${MAX_MESSAGE_LENGTH} characters`, 'VALIDATION_ERROR');
  }

  if (conversationId != null && conversationId !== '') {
    if (!isValidUuid(conversationId)) {
      throw new ApiError(400, 'conversationId must be a valid UUID', 'VALIDATION_ERROR');
    }
  }

  return {
    shopId,
    message,
    conversationId: conversationId || null,
  };
}

function scoreProduct(product, rawMessage, tokens) {
  const name = String(product.name || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const variants = JSON.stringify(product.variants || null).toLowerCase();

  let score = 0;
  const matched = new Set();
  const messageLower = rawMessage.toLowerCase();

  if (messageLower && name.includes(messageLower)) score += 100;

  for (const token of tokens) {
    let tokenMatched = false;

    for (const variantToken of buildTokenVariants(token)) {
      if (name.includes(variantToken)) {
        score += 10;
        tokenMatched = true;
        break;
      }
    }
    for (const variantToken of buildTokenVariants(token)) {
      if (category.includes(variantToken)) {
        score += 5;
        tokenMatched = true;
        break;
      }
    }
    for (const variantToken of buildTokenVariants(token)) {
      if (variants.includes(variantToken)) {
        score += 2;
        tokenMatched = true;
        break;
      }
    }
    if (tokenMatched) matched.add(token);
  }

  return { score, matchedTokens: [...matched] };
}

function buildRecommendation(product, reason) {
  return {
    productId: product.id,
    externalId: product.external_id || null,
    name: product.name || null,
    category: product.category || null,
    productUrl: product.product_url || null,
    garmentImageUrl: product.garment_image_url || null,
    reason: reason || 'Najlepsze dopasowanie do zapytania w katalogu sklepu.',
  };
}

function buildDeterministicRecommendation(product, matchedTokens) {
  const reason = matchedTokens.length > 0
    ? `Dopasowanie po słowach kluczowych: ${matchedTokens.slice(0, 3).join(', ')}.`
    : 'Najlepsze dopasowanie do zapytania w katalogu sklepu.';
  return buildRecommendation(product, reason);
}

function filterCatalogProducts(products, shopId) {
  return (products || []).filter((product) => {
    if (!product) return false;
    if (product.shop_id == null) return false;
    if (String(product.shop_id) !== String(shopId)) return false;
    if (product.is_synced === false) return false;
    return true;
  });
}

function selectTopRecommendations(products, message, maxResults = MAX_RECOMMENDATIONS) {
  const safeProducts = products || [];
  const tokens = tokenizeMessage(message);
  const scored = [];

  for (const product of safeProducts) {
    const { score, matchedTokens } = scoreProduct(product, message, tokens);
    if (score <= 0) continue;
    scored.push({ product, score, matchedTokens });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aName = String(a.product.name || '');
    const bName = String(b.product.name || '');
    return aName.localeCompare(bName);
  });

  if (scored.length > 0) {
    return scored.slice(0, maxResults).map((item) => buildDeterministicRecommendation(item.product, item.matchedTokens));
  }

  // Fail closed: when no keyword score matches, do not return unrelated products.
  return [];
}

function selectCandidateProducts(products, message, maxCandidates = 24) {
  const tokens = tokenizeMessage(message);
  const scored = [];

  for (const product of products || []) {
    const { score } = scoreProduct(product, message, tokens);
    if (score <= 0) continue;
    scored.push({ product, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aName = String(a.product.name || '');
    const bName = String(b.product.name || '');
    return aName.localeCompare(bName);
  });

  return scored.slice(0, maxCandidates).map((item) => item.product);
}

function buildLockedModuleResponse() {
  return {
    error: 'Advisor module is locked for this shop',
    message: 'Advisor module is locked for this shop',
    code: 'MODULE_LOCKED',
    upgrade: {
      requiredModule: 'ai_stylist_advisor',
      action: 'upgrade_plan',
    },
  };
}

async function resolveConversation({ db, clientId, shopId, conversationId }) {
  if (!conversationId) {
    const { data, error } = await db
      .from('advisor_conversations')
      .insert({ client_id: clientId, shop_id: shopId })
      .select('id, client_id, shop_id')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await db
    .from('advisor_conversations')
    .select('id, client_id, shop_id')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
  if (String(data.client_id) !== String(clientId) || String(data.shop_id) !== String(shopId)) {
    throw new ApiError(403, 'Conversation does not belong to this shop', 'CONVERSATION_FORBIDDEN');
  }

  return data;
}

async function insertMessage({ db, conversationId, role, content, recommendationProductIds = [] }) {
  const { data, error } = await db
    .from('advisor_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      recommendation_product_ids: recommendationProductIds,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

async function fetchShopProducts({ db, shopId }) {
  const { data, error } = await db
    .from('products')
    .select('id, shop_id, external_id, name, category, garment_image_url, product_url, variants, is_synced, created_at')
    .eq('shop_id', shopId)
    .eq('is_synced', true)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

async function fetchAdvisorSettings({ db, shopId, clientId }) {
  const { data, error } = await db
    .from('shops')
    .select('widget_config, client_id')
    .eq('id', shopId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return normalizeAdvisorSettings(null);

  const widgetConfig = data.widget_config && typeof data.widget_config === 'object' ? data.widget_config : {};
  return normalizeAdvisorSettings(widgetConfig.advisor || null);
}

async function fetchConversationContext({ db, conversationId, limit = 6 }) {
  if (!conversationId) return [];
  const safeLimit = Math.max(1, Math.min(20, Number(limit) || 6));

  const { data, error } = await db
    .from('advisor_messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;

  return (data || [])
    .slice()
    .reverse()
    .map((item) => ({
      role: item.role,
      content: item.content,
    }));
}

function validateRecommendationsAreCatalogOnly(recommendations, catalogProducts, shopId) {
  const catalogById = new Map((catalogProducts || []).map((product) => [String(product.id), product]));

  for (const recommendation of recommendations || []) {
    const matched = catalogById.get(String(recommendation.productId));
    if (!matched || matched.shop_id == null || String(matched.shop_id) !== String(shopId) || matched.is_synced === false) {
      throw new ApiError(500, 'Catalog validation failed for recommended product', 'CATALOG_VALIDATION_FAILED');
    }
  }
}

function buildFallbackReply(recommendations) {
  return recommendations.length > 0
    ? `Znalazłam ${recommendations.length} propozycje z Twojego katalogu sklepu.`
    : 'Nie znalazłam pasujących produktów w katalogu tego sklepu.';
}

function buildFallbackStylistReply({ message, shoppingIntentLikely, hasRecommendations }) {
  if (hasRecommendations) return null;
  if (shoppingIntentLikely) {
    return 'Nie widzę teraz pasujących produktów w katalogu tego sklepu dla tego zapytania. Mogę pomóc doprecyzować styl, kolor albo okazję i sprawdzę ponownie.';
  }
  if (hasStylingIntent(message)) {
    return 'Jasne, chętnie pomogę stylizacyjnie ✨ Powiedz proszę na jaką okazję szukasz stylizacji i jaki klimat lubisz, a dopasuję wskazówki i potem sprawdzę produkty.';
  }
  return 'Chętnie pomogę ✨ Napisz proszę, czego dokładnie szukasz (okazja, styl, kolor), a dobiorę najlepsze propozycje z tego katalogu.';
}

async function resolveAdvisorOutcome({
  message,
  shopId,
  catalogProducts,
  advisorSettings,
  conversationMessages,
  aiClient,
}) {
  const settings = normalizeAdvisorSettings(advisorSettings);
  const recommendationLimit = clampRecommendationLimit(settings.maxRecommendations);
  const effectiveCatalog = catalogProducts || [];
  const shoppingIntentLikely = hasShoppingIntent(message);
  const candidateProducts = shoppingIntentLikely
    ? selectCandidateProducts(effectiveCatalog, message, 24)
    : [];
  const catalogHasRelevantMatches = candidateProducts.length > 0;
  const forceNoMatchReply = shoppingIntentLikely && !catalogHasRelevantMatches;

  const ai = aiClient || require('./advisorAi');
  const canUseAi = Boolean(ai && typeof ai.isEnabled === 'function' && ai.isEnabled());

  if (canUseAi && effectiveCatalog.length > 0) {
    try {
      const aiResult = await ai.getStylistResponse({
        message,
        advisorSettings: settings,
        conversationMessages: conversationMessages || [],
        productCandidates: candidateProducts,
        maxRecommendations: recommendationLimit,
        shoppingIntentLikely,
        catalogHasRelevantMatches,
      });

      if (!aiResult || typeof aiResult.reply !== 'string' || !Array.isArray(aiResult.selectedProductIds)) {
        throw new Error('AI response schema mismatch');
      }

      const reasonMap = new Map();
      for (const item of aiResult.selectionReasons || []) {
        if (!item || item.productId == null || typeof item.reason !== 'string') continue;
        const key = String(item.productId);
        if (!key || !item.reason.trim()) continue;
        reasonMap.set(key, item.reason.trim());
      }

      const candidateById = new Map(candidateProducts.map((product) => [String(product.id), product]));
      const recommendations = [];
      const seen = new Set();

      for (const rawId of aiResult.selectedProductIds) {
        const id = String(rawId || '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const product = candidateById.get(id);
        if (!product) continue;
        if (product.shop_id == null || String(product.shop_id) !== String(shopId)) continue;
        if (product.is_synced === false) continue;

        recommendations.push(buildRecommendation(
          product,
          reasonMap.get(id) || 'Wybrane przez AI Stylist na podstawie Twojego opisu.',
        ));

        if (recommendations.length >= recommendationLimit) break;
      }

      if (forceNoMatchReply) {
        return {
          reply: buildFallbackStylistReply({
            message,
            shoppingIntentLikely,
            hasRecommendations: false,
          }),
          recommendations: [],
          maxRecommendations: recommendationLimit,
          usedAi: false,
        };
      }

      return {
        reply: aiResult.reply.trim(),
        recommendations,
        maxRecommendations: recommendationLimit,
        usedAi: true,
      };
    } catch (err) {
      // Fall back to deterministic resolver if AI call/output fails.
    }
  }

  const recommendations = forceNoMatchReply
    ? []
    : shoppingIntentLikely
    ? selectTopRecommendations(effectiveCatalog, message, recommendationLimit)
    : [];
  const fallbackStylistReply = buildFallbackStylistReply({
    message,
    shoppingIntentLikely,
    hasRecommendations: recommendations.length > 0,
  });

  return {
    reply: fallbackStylistReply || buildFallbackReply(recommendations),
    recommendations,
    maxRecommendations: recommendationLimit,
    usedAi: false,
  };
}

function buildSuccessResponse({ conversationId, assistantMessageId, shopId, recommendations, reply, maxResults }) {
  const resolvedReply = typeof reply === 'string' && reply.trim() ? reply.trim() : buildFallbackReply(recommendations || []);
  return {
    conversationId,
    assistantMessageId,
    reply: resolvedReply,
    recommendations,
    meta: {
      shopId,
      resultCount: (recommendations || []).length,
      maxResults: clampRecommendationLimit(maxResults),
      module: 'ai_stylist_advisor',
    },
  };
}

module.exports = {
  MAX_RECOMMENDATIONS,
  MAX_MESSAGE_LENGTH,
  isValidUuid,
  tokenizeMessage,
  hasShoppingIntent,
  hasStylingIntent,
  clampRecommendationLimit,
  normalizeAdvisorSettings,
  validateAdvisorChatPayload,
  selectTopRecommendations,
  selectCandidateProducts,
  resolveConversation,
  insertMessage,
  fetchShopProducts,
  fetchAdvisorSettings,
  fetchConversationContext,
  resolveAdvisorOutcome,
  buildSuccessResponse,
  buildLockedModuleResponse,
  filterCatalogProducts,
  validateRecommendationsAreCatalogOnly,
};
