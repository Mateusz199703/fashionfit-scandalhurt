const { ApiError } = require('../middleware/errorHandler');

const MAX_RECOMMENDATIONS = 3;
const MAX_MESSAGE_LENGTH = 1000;

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
    if (name.includes(token)) {
      score += 10;
      tokenMatched = true;
    }
    if (category.includes(token)) {
      score += 5;
      tokenMatched = true;
    }
    if (variants.includes(token)) {
      score += 2;
      tokenMatched = true;
    }
    if (tokenMatched) matched.add(token);
  }

  return { score, matchedTokens: [...matched] };
}

function buildRecommendation(product, matchedTokens) {
  return {
    productId: product.id,
    externalId: product.external_id || null,
    name: product.name || null,
    category: product.category || null,
    productUrl: product.product_url || null,
    garmentImageUrl: product.garment_image_url || null,
    reason: matchedTokens.length > 0
      ? `Dopasowanie po słowach kluczowych: ${matchedTokens.slice(0, 3).join(', ')}.`
      : 'Najlepsze dopasowanie do zapytania w katalogu sklepu.',
  };
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
  const tokens = tokenizeMessage(message);
  const scored = [];

  for (const product of products || []) {
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

  return scored.slice(0, maxResults).map((item) => buildRecommendation(item.product, item.matchedTokens));
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

function buildSuccessResponse({ conversationId, assistantMessageId, shopId, recommendations }) {
  const hasRecommendations = recommendations.length > 0;
  return {
    conversationId,
    assistantMessageId,
    reply: hasRecommendations
      ? `Znalazłam ${recommendations.length} propozycje z Twojego katalogu sklepu.`
      : 'Nie znalazłam pasujących produktów w katalogu tego sklepu.',
    recommendations,
    meta: {
      shopId,
      resultCount: recommendations.length,
      maxResults: MAX_RECOMMENDATIONS,
      module: 'ai_stylist_advisor',
    },
  };
}

module.exports = {
  MAX_RECOMMENDATIONS,
  MAX_MESSAGE_LENGTH,
  isValidUuid,
  tokenizeMessage,
  validateAdvisorChatPayload,
  selectTopRecommendations,
  resolveConversation,
  insertMessage,
  fetchShopProducts,
  buildSuccessResponse,
  buildLockedModuleResponse,
  filterCatalogProducts,
};
