const { ApiError } = require('../middleware/errorHandler');

const MAX_RECOMMENDATIONS = 3;
const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_TONE = 'friendly';
const RESPONSE_TYPES = [
  'answer_only',
  'ask_follow_up',
  'product_search',
  'browse_catalog',
  'no_match',
  'recommend_products',
  'product_explanation',
];
const SHOPPING_INTENT_TERMS = [
  'szukam',
  'szukamy',
  'kup',
  'kupi',
  'kupić',
  'zamówi',
  'chcę',
  'chce',
  'znajdę',
  'znajde',
  'produkt',
  'produkty',
  'pokaż produkt',
  'pokaz produkt',
  'czy są',
  'czy sa',
  'czy znajdę',
  'czy znajde',
  'macie',
];
const BROWSE_CATALOG_TERMS = [
  'pokaż co macie',
  'pokaz co macie',
  'pokaż co macie w ofercie',
  'pokaz co macie w ofercie',
  'co macie w sklepie',
  'pokaż dostępne produkty',
  'pokaz dostepne produkty',
  'pokaż coś ogólnie',
  'pokaz cos ogolnie',
  'może coś znajdę dla siebie',
  'moze cos znajde dla siebie',
  'to pokaż coś z oferty',
  'to pokaz cos z oferty',
  'pokaż ofertę',
  'pokaz oferte',
];
const VAGUE_REQUEST_TERMS = [
  'doradź coś',
  'doradz cos',
  'potrzebuję czegoś',
  'potrzebuje czegos',
  'coś fajnego',
  'cos fajnego',
  'co wybrać',
  'co wybrac',
  'co polecasz',
];
const STYLING_INTENT_TERMS = [
  'co pasuje',
  'jaki kolor',
  'jakie kolory',
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
  'na jakie okazje',
];
const COLOR_TERMS = [
  'czarn', 'biał', 'bial', 'beż', 'bez', 'granat', 'bordo', 'ziel', 'niebiesk', 'błękit', 'blekit',
  'szar', 'czerw', 'róż', 'roz', 'fiolet', 'żół', 'zol', 'pomarańcz', 'pomarancz', 'karmel', 'brąz', 'braz',
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

function hasTerm(text, terms) {
  const normalized = String(text || '').trim().toLowerCase();
  if (!normalized) return false;
  return terms.some((term) => normalized.includes(term));
}

function hasBrowseCatalogIntent(message) {
  return hasTerm(message, BROWSE_CATALOG_TERMS);
}

function hasShoppingIntent(message) {
  if (hasBrowseCatalogIntent(message)) return false;
  return hasTerm(message, SHOPPING_INTENT_TERMS);
}

function hasStylingIntent(message) {
  return hasTerm(message, STYLING_INTENT_TERMS);
}

function hasVagueRequestIntent(message) {
  return hasTerm(message, VAGUE_REQUEST_TERMS);
}

function hasProductExplanationIntent(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return false;
  return /(czy\s+(ten|ta|to)\b)|(ten\s+produkt)|(ta\s+rzecz)|(czy\s+.*\b(będzie|bedzie)\b)/u.test(text);
}

function detectProductFactIntentSubtype(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return null;

  if (/(ile\s+koszt|jaka\s+cena|jaki\s+koszt|kosztuje|cena|price|sale)/u.test(text)) {
    return 'product_price';
  }
  if (/(rozmiar|size|czy\s+jest\s+rozmiar|jaki\s+rozmiar)/u.test(text)) {
    return 'product_variant_question';
  }
  if (/(dostępne\s+kolory|dostepne\s+kolory|kolory\s+są\s+dostępne|kolory\s+sa\s+dostepne|jakie\s+kolory\s+(są|sa)\s+dostępne|jakie\s+kolory\s+ma|jakie\s+kolory\s+mają|jakie\s+kolory\s+maja|kolor(y)?\s+w\s+ofercie)/u.test(text)) {
    return 'product_attribute_question';
  }
  if (/(na\s+stanie|dostępno|dostepno|czy\s+jest\s+dostępn|czy\s+jest\s+dostepn|availability|stock)/u.test(text)) {
    return 'product_availability';
  }
  if (/(materiał|material|skład|sklad|tkanin|z\s+czego|opis|detale|szczegóły|szczegoly|ten\s+produkt|ta\s+sukienka|nada\s+się|nada\s+sie)/u.test(text)) {
    return 'product_details';
  }

  return null;
}

function hasAnyToken(text, tokens) {
  const normalized = String(text || '').toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function buildStylingAdviceFallback(message) {
  const text = String(message || '').toLowerCase();

  if (hasAnyToken(text, ['brunetk', 'ciemnych włos', 'ciemnych wlos'])) {
    return 'Brunetkom zwykle świetnie pasują głębokie i kontrastowe kolory: czerń, biel, bordo, butelkowa zieleń, granat i karmel. Jeśli chcesz, dopasuję to pod konkretną okazję i styl.';
  }

  if (hasAnyToken(text, ['blondyn', 'jasnych włos', 'jasnych wlos'])) {
    return 'Przy jaśniejszych włosach często dobrze działają odcienie pastelowe, beże, błękity i pudrowe róże, ale sporo zależy od karnacji. Chcesz wersję bardziej codzienną czy elegancką?';
  }

  if (hasAnyToken(text, ['wesele', 'ślub', 'slub'])) {
    return 'Na wesele najbezpieczniej celować w elegancję z wygodą: fason podkreślający sylwetkę, tkanina z lekkim ruchem i kolor dopasowany do pory dnia. Wolisz klasykę czy bardziej wyrazisty look?';
  }

  return 'Jasne, chętnie pomogę stylistycznie. Napisz proszę, na jaką okazję, w jakim stylu i kolorach chcesz się poruszać, a podpowiem konkretne kierunki.';
}

function inferRequestedResponseType(message) {
  if (hasBrowseCatalogIntent(message)) return 'browse_catalog';
  if (hasProductExplanationIntent(message)) return 'product_explanation';
  if (hasShoppingIntent(message)) return 'product_search';
  if (hasStylingIntent(message)) return 'answer_only';
  if (hasVagueRequestIntent(message)) return 'ask_follow_up';
  return 'ask_follow_up';
}

function normalizeResponseType(value, fallback = 'ask_follow_up') {
  const candidate = String(value || '').trim().toLowerCase();
  return RESPONSE_TYPES.includes(candidate) ? candidate : fallback;
}

function shouldAllowRecommendationsForResponseType(responseType) {
  return ['recommend_products', 'product_search', 'browse_catalog', 'product_explanation'].includes(responseType);
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

function getProductText(product) {
  return [
    String(product && product.name || '').toLowerCase(),
    String(product && product.category || '').toLowerCase(),
    JSON.stringify((product && product.variants) || null).toLowerCase(),
  ].join(' ');
}

function extractColorTerms(message) {
  const text = String(message || '').toLowerCase();
  return COLOR_TERMS.filter((term) => text.includes(term));
}

function matchesAnyColorTerm(product, colorTerms) {
  if (!Array.isArray(colorTerms) || colorTerms.length === 0) return true;
  const haystack = getProductText(product);
  return colorTerms.some((term) => haystack.includes(term));
}

function extractRequestedSize(message) {
  const text = String(message || '').toLowerCase();
  const explicit = text.match(/\b(xxs|xs|s|m|l|xl|xxl|xxxl)\b/u);
  if (explicit && explicit[1]) return explicit[1].toUpperCase();
  return null;
}

function normalizeVariantStrings(variants) {
  if (!variants || typeof variants !== 'object') return [];
  const out = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
      return;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value).toLowerCase());
    }
  };
  walk(variants);
  return out;
}

function extractVariantValuesByKeys(variants, keyRegex) {
  if (!variants || typeof variants !== 'object') return [];
  const values = [];
  for (const [key, value] of Object.entries(variants)) {
    if (!keyRegex.test(String(key).toLowerCase())) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) values.push(String(item).trim());
      });
      continue;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach((item) => {
        if (item != null) values.push(String(item).trim());
      });
      continue;
    }
    if (value != null) values.push(String(value).trim());
  }
  return values.filter(Boolean);
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
  const colorTerms = extractColorTerms(message);
  const scored = [];

  for (const product of products || []) {
    if (!matchesAnyColorTerm(product, colorTerms)) continue;
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

function selectBrowseCatalogProducts(products, maxCandidates = 24) {
  const list = (products || []).slice().sort((a, b) => {
    const aCreated = Date.parse(a.created_at || 0) || 0;
    const bCreated = Date.parse(b.created_at || 0) || 0;
    return bCreated - aCreated;
  });

  const byCategory = new Map();
  for (const product of list) {
    const category = String(product.category || 'other');
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(product);
  }

  const picks = [];
  const categories = [...byCategory.keys()];
  let guard = 0;
  while (picks.length < maxCandidates && guard < 400) {
    guard += 1;
    let progressed = false;
    for (const category of categories) {
      const bucket = byCategory.get(category);
      if (!bucket || bucket.length === 0) continue;
      picks.push(bucket.shift());
      progressed = true;
      if (picks.length >= maxCandidates) break;
    }
    if (!progressed) break;
  }

  return picks;
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

function buildFallbackReplyByType({ responseType, message, hasCatalogProducts, hasRecommendations }) {
  switch (responseType) {
    case 'answer_only':
      return buildStylingAdviceFallback(message);
    case 'ask_follow_up':
      return 'Chętnie pomogę ✨ Jaki styl, okazję albo kolor masz na myśli?';
    case 'product_explanation':
      return 'Jasne, mogę to ocenić. Napisz proszę, na jaką okazję i w jakim stylu chcesz nosić ten produkt.';
    case 'no_match':
      return 'Nie widzę teraz pasujących produktów w katalogu tego sklepu dla tego zapytania. Mogę pomóc doprecyzować styl, kolor albo okazję i sprawdzę ponownie.';
    case 'browse_catalog':
      return hasCatalogProducts
        ? 'Jasne, pokazuję kilka propozycji z aktualnej oferty sklepu.'
        : 'W tej chwili nie widzę jeszcze produktów w katalogu tego sklepu.';
    case 'recommend_products':
    case 'product_search':
      if (hasRecommendations) return null;
      if (hasTerm(message, VAGUE_REQUEST_TERMS)) {
        return 'Jasne, chętnie pomogę. Powiedz proszę na jaką okazję, jaki styl i budżet bierzesz pod uwagę, a potem dobiorę konkretne propozycje z katalogu.';
      }
      return 'Nie widzę teraz pasujących produktów w katalogu tego sklepu dla tego zapytania. Mogę pomóc doprecyzować styl, kolor albo okazję i sprawdzę ponownie.';
    default:
      return 'Chętnie pomogę ✨ Napisz proszę, czego dokładnie szukasz (okazja, styl, kolor), a dopasuję odpowiedź.';
  }
}

function pickContextProduct({ relevantCandidates, browseCandidates }) {
  if (Array.isArray(relevantCandidates) && relevantCandidates.length > 0) return relevantCandidates[0];
  if (Array.isArray(browseCandidates) && browseCandidates.length > 0) return browseCandidates[0];
  return null;
}

function buildMissingFactReply(subtype, message, { size = null } = {}) {
  switch (subtype) {
    case 'product_price':
      return 'Nie widzę jeszcze ceny tego produktu w danych sklepu.';
    case 'product_variant_question':
      if (size) return `Nie widzę jeszcze dokładnej dostępności rozmiaru ${size} w danych sklepu.`;
      return 'Nie widzę jeszcze dokładnych informacji o dostępności rozmiarów w danych sklepu.';
    case 'product_attribute_question':
      return 'Nie widzę jeszcze informacji o dostępnych kolorach w danych sklepu.';
    case 'product_availability':
      return 'Nie widzę jeszcze aktualnej informacji o stanie dostępności tego produktu w danych sklepu.';
    case 'product_details':
      if (/(materiał|material|tkanin|skład|sklad)/u.test(String(message || '').toLowerCase())) {
        return 'Nie widzę jeszcze informacji o materiale tego produktu w danych sklepu.';
      }
      return 'Nie widzę jeszcze pełnych szczegółów tego produktu w danych sklepu.';
    default:
      return 'Nie widzę jeszcze tej informacji w danych sklepu.';
  }
}

function resolveProductFactOutcome({
  message,
  subtype,
  relevantCandidates,
  browseCandidates,
  recommendationLimit,
}) {
  const contextProduct = pickContextProduct({ relevantCandidates, browseCandidates });
  const requestedSize = extractRequestedSize(message);

  if (subtype === 'product_price') {
    const source = contextProduct || {};
    const rawPrice = source.price != null ? source.price : source.sale_price;
    if (rawPrice == null || rawPrice === '') {
      return {
        responseType: 'product_explanation',
        intentSubtype: 'product_price',
        reply: buildMissingFactReply('product_price', message),
        recommendations: [],
        maxRecommendations: recommendationLimit,
        usedAi: false,
      };
    }

    const currency = String(source.currency || '').trim().toUpperCase();
    const label = source.name ? `„${source.name}”` : 'Ten produkt';
    const priceText = `${rawPrice}${currency ? ` ${currency}` : ''}`.trim();
    return {
      responseType: 'product_explanation',
      intentSubtype: 'product_price',
      reply: `${label} ma obecnie cenę ${priceText} według danych sklepu.`,
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (subtype === 'product_variant_question') {
    const variantValues = normalizeVariantStrings(contextProduct && contextProduct.variants);
    const containsSize = requestedSize
      ? variantValues.some((item) => item === requestedSize.toLowerCase())
      : false;

    if (!containsSize) {
      return {
        responseType: 'product_explanation',
        intentSubtype: 'product_variant_question',
        reply: buildMissingFactReply('product_variant_question', message, { size: requestedSize }),
        recommendations: [],
        maxRecommendations: recommendationLimit,
        usedAi: false,
      };
    }

    return {
      responseType: 'product_explanation',
      intentSubtype: 'product_variant_question',
      reply: `Widzę wariant rozmiaru ${requestedSize} w danych produktu, ale nie widzę jeszcze bieżącej dostępności magazynowej tego rozmiaru.`,
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (subtype === 'product_attribute_question') {
    const colorValues = extractVariantValuesByKeys(contextProduct && contextProduct.variants, /(kolor|color|barwa)/u);
    if (colorValues.length === 0) {
      return {
        responseType: 'product_explanation',
        intentSubtype: 'product_attribute_question',
        reply: buildMissingFactReply('product_attribute_question', message),
        recommendations: [],
        maxRecommendations: recommendationLimit,
        usedAi: false,
      };
    }

    const uniqueColors = [...new Set(colorValues.map((item) => item.toLowerCase()))];
    return {
      responseType: 'product_explanation',
      intentSubtype: 'product_attribute_question',
      reply: `W danych sklepu widzę następujące kolory: ${uniqueColors.slice(0, 6).join(', ')}.`,
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (subtype === 'product_availability') {
    const source = contextProduct || {};
    if (source.stock_status || source.stock != null || source.stock_quantity != null) {
      const status = String(source.stock_status || '').toLowerCase();
      if (status === 'instock' || status === 'in_stock') {
        return {
          responseType: 'product_explanation',
          intentSubtype: 'product_availability',
          reply: 'Według danych sklepu ten produkt jest obecnie dostępny.',
          recommendations: [],
          maxRecommendations: recommendationLimit,
          usedAi: false,
        };
      }
      if (status === 'outofstock' || status === 'out_of_stock') {
        return {
          responseType: 'product_explanation',
          intentSubtype: 'product_availability',
          reply: 'Według danych sklepu ten produkt jest obecnie niedostępny.',
          recommendations: [],
          maxRecommendations: recommendationLimit,
          usedAi: false,
        };
      }
    }

    return {
      responseType: 'product_explanation',
      intentSubtype: 'product_availability',
      reply: buildMissingFactReply('product_availability', message),
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (subtype === 'product_details') {
    const name = contextProduct && contextProduct.name ? `„${contextProduct.name}”` : 'Ten produkt';
    const category = contextProduct && contextProduct.category ? String(contextProduct.category) : null;
    const unknownMaterial = /(materiał|material|tkanin|skład|sklad)/u.test(String(message || '').toLowerCase());

    return {
      responseType: 'product_explanation',
      intentSubtype: 'product_details',
      reply: unknownMaterial
        ? buildMissingFactReply('product_details', message)
        : `${name}${category ? ` z kategorii ${category}` : ''} może sprawdzić się na lato, jeśli zależy Ci na lżejszej i przewiewnej stylizacji. Jeśli chcesz, podpowiem jaki fason i kolor najlepiej dobrać do okazji.`,
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  return null;
}

function buildDeterministicBrowseRecommendations(candidates, recommendationLimit) {
  return (candidates || [])
    .slice(0, recommendationLimit)
    .map((product) => buildRecommendation(product, 'Propozycja z aktualnej oferty sklepu.'));
}

function buildRecommendationsFromIds({
  rawIds,
  candidates,
  shopId,
  recommendationLimit,
  reasonMap,
  defaultReason,
}) {
  const candidateById = new Map((candidates || []).map((product) => [String(product.id), product]));
  const recommendations = [];
  const seen = new Set();

  for (const rawId of rawIds || []) {
    const id = String(rawId || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const product = candidateById.get(id);
    if (!product) continue;
    if (product.shop_id == null || String(product.shop_id) !== String(shopId)) continue;
    if (product.is_synced === false) continue;

    recommendations.push(buildRecommendation(
      product,
      (reasonMap && reasonMap.get(id)) || defaultReason,
    ));

    if (recommendations.length >= recommendationLimit) break;
  }

  return recommendations;
}

function buildDeterministicOutcome({
  message,
  requestedType,
  relevantCandidates,
  browseCandidates,
  recommendationLimit,
}) {
  if (requestedType === 'no_match') {
    return {
      responseType: 'no_match',
      reply: buildFallbackReplyByType({
        responseType: 'no_match',
        message,
        hasCatalogProducts: relevantCandidates.length > 0,
        hasRecommendations: false,
      }),
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (requestedType === 'browse_catalog') {
    const recommendations = buildDeterministicBrowseRecommendations(browseCandidates, recommendationLimit);
    return {
      responseType: 'browse_catalog',
      reply: buildFallbackReplyByType({
        responseType: 'browse_catalog',
        message,
        hasCatalogProducts: browseCandidates.length > 0,
        hasRecommendations: recommendations.length > 0,
      }),
      recommendations,
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (requestedType === 'product_search') {
    const searchRecommendations = selectTopRecommendations(relevantCandidates, message, recommendationLimit);
    if (searchRecommendations.length === 0) {
      return {
        responseType: 'no_match',
        reply: buildFallbackReplyByType({
          responseType: 'no_match',
          message,
          hasCatalogProducts: relevantCandidates.length > 0,
          hasRecommendations: false,
        }),
        recommendations: [],
        maxRecommendations: recommendationLimit,
        usedAi: false,
      };
    }

    return {
      responseType: 'recommend_products',
      reply: buildFallbackReply(searchRecommendations),
      recommendations: searchRecommendations,
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (requestedType === 'product_explanation') {
    return {
      responseType: 'product_explanation',
      reply: buildFallbackReplyByType({
        responseType: 'product_explanation',
        message,
        hasCatalogProducts: relevantCandidates.length > 0,
        hasRecommendations: false,
      }),
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (requestedType === 'answer_only') {
    return {
      responseType: 'answer_only',
      reply: buildFallbackReplyByType({
        responseType: 'answer_only',
        message,
        hasCatalogProducts: relevantCandidates.length > 0,
        hasRecommendations: false,
      }),
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  if (requestedType === 'ask_follow_up') {
    return {
      responseType: 'ask_follow_up',
      reply: buildFallbackReplyByType({
        responseType: 'ask_follow_up',
        message,
        hasCatalogProducts: relevantCandidates.length > 0,
        hasRecommendations: false,
      }),
      recommendations: [],
      maxRecommendations: recommendationLimit,
      usedAi: false,
    };
  }

  return {
    responseType: 'ask_follow_up',
    reply: buildFallbackReplyByType({
      responseType: 'ask_follow_up',
      message,
      hasCatalogProducts: relevantCandidates.length > 0,
      hasRecommendations: false,
    }),
    recommendations: [],
    maxRecommendations: recommendationLimit,
    usedAi: false,
  };
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
  const factualSubtype = detectProductFactIntentSubtype(message);
  const requestedType = factualSubtype ? 'product_explanation' : inferRequestedResponseType(message);
  const relevantCandidates = selectCandidateProducts(effectiveCatalog, message, 24);
  const browseCandidates = selectBrowseCatalogProducts(effectiveCatalog, 24);

  if (factualSubtype) {
    const factOutcome = resolveProductFactOutcome({
      message,
      subtype: factualSubtype,
      relevantCandidates,
      browseCandidates,
      recommendationLimit,
    });
    if (factOutcome) return factOutcome;
  }

  const decisionCandidates = requestedType === 'browse_catalog'
    ? browseCandidates
    : ['product_search', 'product_explanation'].includes(requestedType)
    ? relevantCandidates
    : [];

  const forcedType = requestedType === 'product_search' && relevantCandidates.length === 0
    ? 'no_match'
    : requestedType;

  const ai = aiClient || require('./advisorAi');
  const canUseAi = Boolean(ai && typeof ai.isEnabled === 'function' && ai.isEnabled());

  if (canUseAi) {
    try {
      const aiResult = await ai.getStylistResponse({
        message,
        advisorSettings: settings,
        conversationMessages: conversationMessages || [],
        productCandidates: decisionCandidates,
        maxRecommendations: recommendationLimit,
        shoppingIntentLikely: requestedType === 'product_search',
        catalogHasRelevantMatches: decisionCandidates.length > 0,
        desiredResponseType: forcedType,
        allowedResponseTypes: RESPONSE_TYPES,
      });

      if (!aiResult || typeof aiResult.reply !== 'string' || !Array.isArray(aiResult.recommendedProductIds)) {
        throw new Error('AI response schema mismatch');
      }

      const reasonMap = new Map();
      for (const item of aiResult.selectionReasons || []) {
        if (!item || item.productId == null || typeof item.reason !== 'string') continue;
        const key = String(item.productId);
        if (!key || !item.reason.trim()) continue;
        reasonMap.set(key, item.reason.trim());
      }

      let responseType = normalizeResponseType(aiResult.responseType, forcedType);
      const allowRecommendationsByType = shouldAllowRecommendationsForResponseType(responseType);

      if (forcedType === 'no_match') responseType = 'no_match';
      if (forcedType === 'browse_catalog') {
        responseType = responseType === 'recommend_products' ? 'recommend_products' : 'browse_catalog';
      }

      const recommendationSource = forcedType === 'browse_catalog' ? browseCandidates : relevantCandidates;
      let recommendations = allowRecommendationsByType
        ? buildRecommendationsFromIds({
          rawIds: aiResult.recommendedProductIds,
          candidates: recommendationSource,
          shopId,
          recommendationLimit,
          reasonMap,
          defaultReason: 'Wybrane przez AI Stylist na podstawie Twojej wiadomości.',
        })
        : [];

      if (forcedType === 'browse_catalog' && recommendations.length === 0 && browseCandidates.length > 0) {
        recommendations = buildDeterministicBrowseRecommendations(browseCandidates, recommendationLimit);
      }

      if (forcedType === 'product_search' && recommendations.length === 0) {
        responseType = 'no_match';
      }

      if (responseType === 'no_match') {
        const aiNoMatchReply = String(aiResult.reply || '').trim();
        return {
          responseType: 'no_match',
          reply: aiNoMatchReply || buildFallbackReplyByType({
            responseType: 'no_match',
            message,
            hasCatalogProducts: relevantCandidates.length > 0,
            hasRecommendations: false,
          }),
          recommendations: [],
          maxRecommendations: recommendationLimit,
          usedAi: Boolean(aiNoMatchReply),
        };
      }

      const reply = String(aiResult.reply || '').trim()
        || buildFallbackReplyByType({
          responseType,
          message,
          hasCatalogProducts: recommendationSource.length > 0,
          hasRecommendations: recommendations.length > 0,
        })
        || buildFallbackReply(recommendations);

      return {
        responseType,
        reply,
        recommendations,
        maxRecommendations: recommendationLimit,
        usedAi: true,
      };
    } catch (err) {
      // Fall back to deterministic resolver if AI call/output fails.
    }
  }

  return buildDeterministicOutcome({
    message,
    requestedType: forcedType,
    relevantCandidates,
    browseCandidates,
    recommendationLimit,
  });
}

function buildSuccessResponse({
  conversationId,
  assistantMessageId,
  shopId,
  recommendations,
  reply,
  maxResults,
  responseType,
  intentSubtype,
}) {
  const safeResponseType = normalizeResponseType(responseType, recommendations && recommendations.length > 0 ? 'recommend_products' : 'answer_only');
  const resolvedReply = typeof reply === 'string' && reply.trim()
    ? reply.trim()
    : buildFallbackReply(recommendations || []);

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
      responseType: safeResponseType,
      intentSubtype: intentSubtype || null,
    },
  };
}

module.exports = {
  MAX_RECOMMENDATIONS,
  MAX_MESSAGE_LENGTH,
  RESPONSE_TYPES,
  isValidUuid,
  tokenizeMessage,
  hasShoppingIntent,
  hasStylingIntent,
  hasBrowseCatalogIntent,
  hasVagueRequestIntent,
  hasProductExplanationIntent,
  detectProductFactIntentSubtype,
  inferRequestedResponseType,
  normalizeResponseType,
  clampRecommendationLimit,
  normalizeAdvisorSettings,
  validateAdvisorChatPayload,
  selectTopRecommendations,
  selectCandidateProducts,
  selectBrowseCatalogProducts,
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
