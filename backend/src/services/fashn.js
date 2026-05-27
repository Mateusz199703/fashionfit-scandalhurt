const fetch = require('node-fetch');
const config = require('../config');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
}

async function getStatus(predictionId) {
  const res = await fetch(`${config.fashn.baseUrl}/status/${predictionId}`, {
    headers: { Authorization: `Bearer ${config.fashn.apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`FASHN status failed: ${JSON.stringify(data)}`);
  }
  return data; // { id, status, output, error }
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

module.exports = { run, getStatus, pollUntilComplete, mapToFashnCategory };
