const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ALLOWED_RESPONSE_TYPES,
  parseStylistOutput,
  buildSystemPrompt,
} = require('../src/services/advisorAi');

test('parseStylistOutput parses valid JSON response', () => {
  const parsed = parseStylistOutput(JSON.stringify({
    responseType: 'recommend_products',
    reply: 'Polecam te modele na wesele.',
    recommendedProductIds: ['p1', 'p2'],
    followUpQuestion: '',
    confidence: 0.76,
    selectionReasons: [
      { productId: 'p1', reason: 'Klasyczna sylwetka.' },
      { productId: 'p2', reason: 'Dobrze pasuje do okazji.' },
    ],
  }));

  assert.equal(parsed.responseType, 'recommend_products');
  assert.equal(parsed.reply, 'Polecam te modele na wesele.');
  assert.deepEqual(parsed.recommendedProductIds, ['p1', 'p2']);
  assert.equal(parsed.confidence, 0.76);
  assert.equal(parsed.selectionReasons.length, 2);
});

test('parseStylistOutput accepts JSON wrapped in markdown fences', () => {
  const parsed = parseStylistOutput('```json\n{"responseType":"answer_only","reply":"OK","recommendedProductIds":[],"selectionReasons":[]}\n```');
  assert.equal(parsed.responseType, 'answer_only');
  assert.equal(parsed.reply, 'OK');
  assert.deepEqual(parsed.recommendedProductIds, []);
});

test('parseStylistOutput rejects malformed or invalid schema', () => {
  assert.throws(() => parseStylistOutput('{not-json'));
  assert.throws(() => parseStylistOutput(JSON.stringify({ responseType: 'answer_only', reply: '', recommendedProductIds: [] })));
  assert.throws(() => parseStylistOutput(JSON.stringify({ responseType: 'unknown_type', reply: 'x', recommendedProductIds: [] })));
  assert.throws(() => parseStylistOutput(JSON.stringify({ responseType: 'answer_only', reply: 'x' })));
});

test('system prompt contains catalog-only and no-hallucination guardrails', () => {
  const prompt = buildSystemPrompt();
  assert.match(prompt, /friendly boutique fashion consultant/i);
  assert.match(prompt, /default language: polish/i);
  assert.match(prompt, /allowed responsetype values/i);
  assert.match(prompt, /only pick ids from provided productCandidates/i);
  assert.match(prompt, /never invent product names, prices, urls, sizes, colors, stock, material, or availability/i);
  assert.match(prompt, /return json only/i);
});

test('all response types are recognized by parser and contract', () => {
  for (const responseType of ALLOWED_RESPONSE_TYPES) {
    const parsed = parseStylistOutput(JSON.stringify({
      responseType,
      reply: `Typ ${responseType}`,
      recommendedProductIds: [],
      selectionReasons: [],
    }));
    assert.equal(parsed.responseType, responseType);
  }
});
