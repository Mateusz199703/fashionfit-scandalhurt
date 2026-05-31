const fetch = require('node-fetch');
const config = require('../config');

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

  if (!Array.isArray(parsed.selectedProductIds)) {
    throw new Error('AI output is missing selectedProductIds array');
  }

  const selectedProductIds = parsed.selectedProductIds
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return {
    reply,
    selectedProductIds,
    selectionReasons: normalizeSelectionReasons(parsed.selectionReasons),
  };
}

function buildSystemPrompt() {
  return [
    'You are FashionFit AI Stylist, a premium ecommerce fashion stylist assistant.',
    'Your role: provide natural, contextual styling guidance based on customer intent, occasion, tone, and outfit logic.',
    'You MUST only select products from the provided productCandidates list.',
    'Never invent products, prices, images, URLs, sizes, stock, or availability.',
    'Do not mention products outside productCandidates.',
    'Do not provide medical/body-sensitive judgments.',
    'Do not claim exact fit/size certainty unless explicitly provided in candidate data.',
    'If intent is unclear or candidate list is insufficient, ask one short follow-up question in reply.',
    'Return JSON only with this schema:',
    '{"reply":"string","selectedProductIds":["string"],"selectionReasons":[{"productId":"string","reason":"string"}]}.',
    'Do not return markdown or extra keys.',
  ].join(' ');
}

function buildUserPrompt({ message, advisorSettings, conversationMessages, productCandidates, maxRecommendations }) {
  const payload = {
    userMessage: message,
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
    },
  };

  return JSON.stringify(payload);
}

async function getStylistResponse({ message, advisorSettings, conversationMessages, productCandidates, maxRecommendations }) {
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
  isEnabled,
  getStylistResponse,
  parseStylistOutput,
  buildSystemPrompt,
};
