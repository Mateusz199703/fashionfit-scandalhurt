const fetch = require('node-fetch');
const config = require('../config');

const ALLOWED_RESPONSE_TYPES = new Set([
  'answer_only',
  'ask_follow_up',
  'product_search',
  'browse_catalog',
  'no_match',
  'recommend_products',
  'product_explanation',
]);

function isEnabled() {
  return Boolean(config.advisorAi.enabled && config.advisorAi.apiKey);
}

function stripCodeFences(text) {
  const raw = String(text || '').trim();
  if (!raw.startsWith('```')) return raw;
  return raw
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/```$/, '')
    .trim();
}

function normalizeSelectionReasons(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      productId: item && item.productId != null ? String(item.productId).trim() : '',
      reason: item && typeof item.reason === 'string' ? item.reason.trim() : '',
    }))
    .filter((item) => item.productId && item.reason);
}

function parseStylistOutput(rawContent) {
  const cleaned = stripCodeFences(rawContent);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI output is not valid JSON: ${err.message}`);
  }

  const reply = parsed && typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
  if (!reply) throw new Error('AI output is missing non-empty reply');

  const responseType = parsed && typeof parsed.responseType === 'string'
    ? parsed.responseType.trim().toLowerCase()
    : '';
  if (!ALLOWED_RESPONSE_TYPES.has(responseType)) {
    throw new Error('AI output contains invalid responseType');
  }

  const rawRecommendedIds = Array.isArray(parsed.recommendedProductIds)
    ? parsed.recommendedProductIds
    : Array.isArray(parsed.selectedProductIds)
    ? parsed.selectedProductIds
    : null;
  if (!rawRecommendedIds) {
    throw new Error('AI output is missing recommendedProductIds array');
  }

  const recommendedProductIds = rawRecommendedIds
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  const followUpQuestion = parsed && typeof parsed.followUpQuestion === 'string'
    ? parsed.followUpQuestion.trim()
    : '';
  const confidence = Number(parsed && parsed.confidence);

  return {
    responseType,
    reply,
    recommendedProductIds,
    followUpQuestion: followUpQuestion || null,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
    selectionReasons: normalizeSelectionReasons(parsed.selectionReasons),
  };
}

function buildSystemPrompt() {
  return [
    'You are FashionFit AI Stylist: a friendly boutique fashion consultant.',
    'Default language: Polish.',
    'Be natural, concise, conversational, and fashion-aware.',
    'Write like a real human stylist, not a scripted FAQ bot.',
    'For styling questions, give concrete fashion guidance first (colors, cuts, fabrics, occasions), then optionally ask one short follow-up question.',
    'Avoid repetitive generic openings and avoid repeating the same sentence templates.',
    'Decide intent per message and set responseType accordingly.',
    'Allowed responseType values:',
    'answer_only, ask_follow_up, product_search, browse_catalog, no_match, recommend_products, product_explanation.',
    'If user asks general styling advice, prefer answer_only and no product IDs.',
    'If context is vague, prefer ask_follow_up with one useful follow-up question.',
    'If user asks to browse general offer, use browse_catalog.',
    'If user asks product/category availability and there is no relevant candidate, use no_match.',
    'For product fact questions (price, stock, size, colors, material), use only provided catalog facts.',
    'If factual data is missing, state naturally that data is not visible yet in shop data; do not guess.',
    'Only recommend products when they are relevant to user intent.',
    'You MUST only pick IDs from provided productCandidates.',
    'Never invent product names, prices, URLs, sizes, colors, stock, material, or availability.',
    'Do not mention internal system logic.',
    'Do not provide medical/body-sensitive judgments.',
    'Do not claim exact fit certainty unless data explicitly supports it.',
    'Return JSON only with this schema:',
    '{"responseType":"string","reply":"string","recommendedProductIds":["string"],"followUpQuestion":"string","confidence":0.0,"selectionReasons":[{"productId":"string","reason":"string"}]}.',
    'Do not return markdown or extra keys.',
  ].join(' ');
}

function buildUserPrompt({
  message,
  advisorSettings,
  conversationMessages,
  productCandidates,
  maxRecommendations,
  shoppingIntentLikely,
  catalogHasRelevantMatches,
  desiredResponseType,
  allowedResponseTypes,
}) {
  const payload = {
    userMessage: message,
    contextSignals: {
      shoppingIntentLikely: Boolean(shoppingIntentLikely),
      catalogHasRelevantMatches: Boolean(catalogHasRelevantMatches),
      desiredResponseType: desiredResponseType || null,
      allowedResponseTypes: Array.isArray(allowedResponseTypes) ? allowedResponseTypes : null,
    },
    advisorSettings: {
      tone: advisorSettings.tone,
      welcomeMessage: advisorSettings.welcomeMessage,
      maxRecommendations,
    },
    conversationContext: (conversationMessages || []).map((item) => ({
      role: item.role,
      content: String(item.content || ''),
    })),
    productCandidates: (productCandidates || []).map((item) => ({
      productId: String(item.id),
      name: item.name || null,
      category: item.category || null,
      externalId: item.external_id || null,
      productUrl: item.product_url || null,
      garmentImageUrl: item.garment_image_url || null,
    })),
    constraints: {
      maxRecommendations,
      mustUseProvidedCandidatesOnly: true,
      outputLanguage: 'Polish',
      allowedResponseTypes: Array.isArray(allowedResponseTypes) ? allowedResponseTypes : null,
    },
  };

  return JSON.stringify(payload);
}

async function getStylistResponse({
  message,
  advisorSettings,
  conversationMessages,
  productCandidates,
  maxRecommendations,
  shoppingIntentLikely = false,
  catalogHasRelevantMatches = false,
  desiredResponseType = null,
  allowedResponseTypes = null,
}) {
  if (!isEnabled()) throw new Error('Advisor AI is disabled or missing OPENAI_API_KEY');

  const controller = new AbortController();
  const timeoutMs = config.advisorAi.timeoutMs;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.advisorAi.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.advisorAi.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.advisorAi.model,
        temperature: config.advisorAi.temperature,
        max_tokens: config.advisorAi.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          {
            role: 'user',
            content: buildUserPrompt({
              message,
              advisorSettings,
              conversationMessages,
              productCandidates,
              maxRecommendations,
              shoppingIntentLikely,
              catalogHasRelevantMatches,
              desiredResponseType,
              allowedResponseTypes,
            }),
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : `OpenAI request failed (${res.status})`;
      throw new Error(msg);
    }

    const content = data
      && Array.isArray(data.choices)
      && data.choices[0]
      && data.choices[0].message
      && typeof data.choices[0].message.content === 'string'
      ? data.choices[0].message.content
      : '';

    return parseStylistOutput(content);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  ALLOWED_RESPONSE_TYPES,
  isEnabled,
  getStylistResponse,
  parseStylistOutput,
  buildSystemPrompt,
};
