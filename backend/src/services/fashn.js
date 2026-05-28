const fetch = require('node-fetch');
const config = require('../config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CIRCUIT_OPEN_MS = 60 * 1000;
const CIRCUIT_WINDOW = 10;
const CIRCUIT_MIN_SAMPLES = 5;
const CIRCUIT_FAILURE_RATE = 0.5;

const circuit = {
  state: 'closed', // closed | open | half-open
  openUntilMs: 0,
  outcomes: [],
};

function getCircuitState() {
  if (circuit.state === 'open' && Date.now() >= circuit.openUntilMs) {
    circuit.state = 'half-open';
  }
  return circuit.state;
}

function recordOutcome(success) {
  circuit.outcomes.push(success ? 1 : 0);
  if (circuit.outcomes.length > CIRCUIT_WINDOW) circuit.outcomes.shift();

  if (success) {
    circuit.state = 'closed';
    return;
  }

  const samples = circuit.outcomes.length;
  if (samples < CIRCUIT_MIN_SAMPLES) return;
  const failures = circuit.outcomes.filter((x) => x === 0).length;
  const rate = failures / samples;
  if (rate >= CIRCUIT_FAILURE_RATE) {
    circuit.state = 'open';
    circuit.openUntilMs = Date.now() + CIRCUIT_OPEN_MS;
  }
}

async function withCircuitBreaker(operation) {
  const state = getCircuitState();
  if (state === 'open') {
    throw new Error('FASHN service temporarily unavailable (circuit open)');
  }
  try {
    const result = await operation();
    recordOutcome(true);
    return result;
  } catch (err) {
    recordOutcome(false);
    throw err;
  }
}

// Map a FashionFit product_category to a FASHN.ai garment category.
function mapToFashnCategory(category) {
  switch (category) {
    case 'tops':
    case 'outerwear':
      return 'tops';
    case 'bottoms':
      return 'bottoms';
    case 'one-pieces':
      return 'one-pieces';
    default:
      return 'auto';
  }
}

async function run({ modelImage, garmentImage, category }) {
  return withCircuitBreaker(async () => {
    const res = await fetch(`${config.fashn.baseUrl}/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.fashn.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: mapToFashnCategory(category),
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(`FASHN run failed: ${JSON.stringify(data.error || data)}`);
    }
    return data.id;
  });
}

async function getStatus(predictionId) {
  return withCircuitBreaker(async () => {
    const res = await fetch(`${config.fashn.baseUrl}/status/${predictionId}`, {
      headers: { Authorization: `Bearer ${config.fashn.apiKey}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`FASHN status failed: ${JSON.stringify(data)}`);
    }
    return data; // { id, status, output, error }
  });
}

// Poll until the prediction completes, fails, or the timeout elapses.
async function pollUntilComplete(predictionId, options = {}) {
  const timeoutMs = options.timeoutMs || config.fashn.pollTimeoutMs;
  const intervalMs = options.intervalMs || config.fashn.pollIntervalMs;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const data = await getStatus(predictionId);
    if (data.status === 'completed') return data;
    if (data.status === 'failed') {
      throw new Error(`FASHN prediction failed: ${JSON.stringify(data.error)}`);
    }
    await sleep(intervalMs);
  }
  throw new Error('FASHN polling timed out');
}

module.exports = { run, getStatus, pollUntilComplete, mapToFashnCategory, getCircuitState };
