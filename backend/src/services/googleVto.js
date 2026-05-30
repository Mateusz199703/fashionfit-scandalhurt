const fetch = require('node-fetch');
const config = require('../config');
const { getAccessToken } = require('./googleAuth');

const MAX_QUALITY_PRESET = Object.freeze({
  sampleCount: 4,
  outputMimeType: 'image/png',
  addWatermark: false,
  minBaseSteps: 32,
});

function getEndpoint() {
  const projectId = config.google.projectId;
  const location = config.google.location;
  const modelId = config.google.vtoModel;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT is not configured');
  }

  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
}

async function fetchToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status}) from ${url}`);
  }
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString('base64'), contentType };
}

function normalizePrediction(prediction) {
  if (!prediction || typeof prediction !== 'object') return null;

  if (prediction.bytesBase64Encoded) {
    return {
      resultBase64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || 'image/png',
    };
  }

  const image = prediction.image || {};
  if (image.bytesBase64Encoded) {
    return {
      resultBase64: image.bytesBase64Encoded,
      mimeType: image.mimeType || prediction.mimeType || 'image/png',
    };
  }

  return null;
}

function pickBestPrediction(predictions) {
  if (!Array.isArray(predictions) || !predictions.length) return null;
  const normalized = predictions
    .map(normalizePrediction)
    .filter((item) => item && item.resultBase64);
  if (!normalized.length) return null;
  return normalized.sort((a, b) => (b.resultBase64.length || 0) - (a.resultBase64.length || 0))[0];
}

async function generateTryOnFromUrls({ modelImageUrl, garmentImageUrl }) {
  const endpoint = getEndpoint();
  const token = await getAccessToken();

  const [personImage, garmentImage] = await Promise.all([
    fetchToBase64(modelImageUrl),
    fetchToBase64(garmentImageUrl),
  ]);

  const mimeType = MAX_QUALITY_PRESET.outputMimeType;
  const outputOptions = { mimeType };
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    outputOptions.compressionQuality = 100;
  }

  const parameters = {
    sampleCount: MAX_QUALITY_PRESET.sampleCount,
    addWatermark: MAX_QUALITY_PRESET.addWatermark,
    outputOptions,
  };
  const configuredSteps = Number(config.google.vto.baseSteps);
  const baseSteps = Number.isFinite(configuredSteps) && configuredSteps > 0
    ? Math.max(MAX_QUALITY_PRESET.minBaseSteps, configuredSteps)
    : MAX_QUALITY_PRESET.minBaseSteps;
  parameters.baseSteps = baseSteps;

  const payload = {
    instances: [
      {
        personImage: {
          image: {
            bytesBase64Encoded: personImage.base64,
          },
        },
        productImages: [
          {
            image: {
              bytesBase64Encoded: garmentImage.base64,
            },
          },
        ],
      },
    ],
    parameters,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    const message = body && body.error
      ? JSON.stringify(body.error)
      : `Google VTO request failed (${response.status})`;
    throw new Error(message);
  }

  const normalized = pickBestPrediction(body.predictions);
  if (!normalized || !normalized.resultBase64) {
    throw new Error('Google VTO did not return a valid image result');
  }

  return {
    provider: 'google_vto',
    resultBase64: normalized.resultBase64,
    mimeType: normalized.mimeType || 'image/jpeg',
  };
}

async function healthCheck() {
  try {
    await getAccessToken();
    if (!config.google.projectId) return false;
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  generateTryOnFromUrls,
  healthCheck,
};
