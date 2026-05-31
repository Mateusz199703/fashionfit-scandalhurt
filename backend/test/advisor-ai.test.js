const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseStylistOutput,
  buildSystemPrompt,
} = require('../src/services/advisorAi');

test('parseStylistOutput parses valid JSON response', () => {
  const parsed = parseStylistOutput(JSON.stringify({
    reply: 'Polecam te modele na wesele.',
    selectedProductIds: ['p1', 'p2'],
    selectionReasons: [
      { productId: 'p1', reason: 'Klasyczna sylwetka.' },
      { productId: 'p2', reason: 'Dobrze pasuje do okazji.' },
    ],
  }));

  assert.equal(parsed.reply, 'Polecam te modele na wesele.');
  assert.deepEqual(parsed.selectedProductIds, ['p1', 'p2']);
  assert.equal(parsed.selectionReasons.length, 2);
});

test('parseStylistOutput accepts JSON wrapped in markdown fences', () => {
  const parsed = parseStylistOutput('```json\n{"reply":"OK","selectedProductIds":["p1"],"selectionReasons":[]}\n```');
  assert.equal(parsed.reply, 'OK');
  assert.deepEqual(parsed.selectedProductIds, ['p1']);
});

test('parseStylistOutput rejects malformed or invalid schema', () => {
  assert.throws(() => parseStylistOutput('{not-json')); 
  assert.throws(() => parseStylistOutput(JSON.stringify({ reply: '', selectedProductIds: [] })));
  assert.throws(() => parseStylistOutput(JSON.stringify({ reply: 'x' })));
});

test('system prompt contains catalog-only and no-hallucination guardrails', () => {
  const prompt = buildSystemPrompt();
  assert.match(prompt, /only select products from the provided productCandidates/i);
  assert.match(prompt, /never invent products, prices, images, urls, sizes, stock/i);
  assert.match(prompt, /return json only/i);
});
