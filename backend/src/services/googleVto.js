const fetch = require('node-fetch');
const sharp = require('sharp');
const config = require('../config');
const { getAccessToken } = require('./googleAuth');

const VTO_LIMITS = Object.freeze({
  maxImageBytes: 10 * 1024 * 1024,
  maxLongEdgePx: 4096,
  targetRatio: 2 / 3,
  minResultLongEdgePx: 700,
  minResultBytes: 1024,
});

const DEFAULT_PRESET = Object.freeze({
  sampleCount: 2,
  outputMimeType: 'image/png',
  addWatermark: false,
  minBaseSteps: 32,
  safetySetting: 'block_only_high',
});

let windowStartMs = 0;
let requestsInWindow = 0;

function getEndpoint() {
  const projectId = config.google.projectId;
  const location = config.google.location;
  const modelId = config.google.vtoModel;

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT is not configured');
  }

  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

function markLocalQuotaUsage() {
  const safeRpm = Number(config.google.vto.safeRequestsPerMin || 0);
  if (!Number.isFinite(safeRpm) || safeRpm <= 0) return;

  const now = Date.now();
  if (!windowStartMs || now - windowStartMs >= 60 * 1000) {
    windowStartMs = now;
    requestsInWindow = 0;
  }

  if (requestsInWindow >= safeRpm) {
    const retryAfterSec = Math.max(1, Math.ceil((60 * 1000 - (now - windowStartMs)) / 1000));
    const err = new Error(`Local Google VTO rate guard hit (${safeRpm}/min). Retry in ${retryAfterSec}s.`);
    err.code = 'VTO_LOCAL_RATE_LIMIT';
    err.statusCode = 429;
    err.retryAfterSec = retryAfterSec;
    throw err;
  }

  requestsInWindow += 1;
}

function normalizeInputBase64(payload) {
  return String(payload || '').includes(',') ? String(payload).split(',').pop() : String(payload || '');
}

function ensureBuffer(input) {
  if (Buffer.isBuffer(input)) return input;
  const raw = normalizeInputBase64(input);
  if (!raw) throw new Error('Image input is empty');
  return Buffer.from(raw, 'base64');
}

async function fetchBinary(url, label) {
  const { signal, clear } = getTimeoutSignal(clamp(config.google.vto.assetFetchTimeoutMs || 20000, 5000, 60000));
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${label} image (${res.status}) from ${url}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`Fetching ${label} image timed out`);
    }
    throw error;
  } finally {
    clear();
  }
}

function validateInputSize(buffer, label) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error(`${label} image is empty`);
  }
  if (buffer.length > VTO_LIMITS.maxImageBytes) {
    throw new Error(`${label} image exceeds 10MB (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`);
  }
}

async function padToPortraitRatio(buffer, background) {
  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const width = Number(meta.width || 0);
  const height = Number(meta.height || 0);
  if (!width || !height) {
    throw new Error('Could not determine image dimensions for ratio normalization');
  }

  const target = VTO_LIMITS.targetRatio;
  const ratio = width / height;
  let targetWidth = width;
  let targetHeight = height;

  if (Math.abs(ratio - target) > 0.01) {
    if (ratio > target) {
      targetHeight = Math.round(width / target);
    } else {
      targetWidth = Math.round(height * target);
    }
  }

  const left = Math.max(0, Math.floor((targetWidth - width) / 2));
  const right = Math.max(0, targetWidth - width - left);
  const top = Math.max(0, Math.floor((targetHeight - height) / 2));
  const bottom = Math.max(0, targetHeight - height - top);

  return sharp(buffer, { failOn: 'none' })
    .extend({ top, bottom, left, right, background })
    .toBuffer();
}

async function preprocessForVto(buffer, type) {
  validateInputSize(buffer, type);

  const inputLongEdgePx = clamp(
    Number(config.google.vto.inputLongEdgePx || 2048),
    1024,
    VTO_LIMITS.maxLongEdgePx,
  );

  let img = sharp(buffer, { failOn: 'none', limitInputPixels: false })
    .rotate() // respects EXIF orientation
    .toColorspace('srgb');

  if (type === 'garment') {
    // Garment-only prep: remove empty margins and normalize to clean white canvas.
    img = img.flatten({ background: '#ffffff' });
  }

  let preprocessed = await img.toBuffer();

  if (type === 'garment') {
    preprocessed = await sharp(preprocessed, { failOn: 'none' })
      .trim({ threshold: 12 })
      .toBuffer();
  }

  preprocessed = await padToPortraitRatio(preprocessed, type === 'garment' ? '#ffffff' : '#f5f5f5');

  const output = await sharp(preprocessed, { failOn: 'none' })
    .resize({
      width: inputLongEdgePx,
      height: inputLongEdgePx,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: type === 'garment' ? 95 : 93, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();

  validateInputSize(output, `${type} preprocessed`);

  const meta = await sharp(output, { failOn: 'none' }).metadata();
  return {
    buffer: output,
    width: Number(meta.width || 0),
    height: Number(meta.height || 0),
    mimeType: 'image/jpeg',
  };
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
  const normalized = predictions.map(normalizePrediction).filter((item) => item && item.resultBase64);
  if (!normalized.length) return null;
  // Vertex usually returns best sample first.
  return normalized[0];
}

async function validateResultImage(resultBase64) {
  const raw = normalizeInputBase64(resultBase64);
  if (!raw) {
    throw new Error('Google VTO returned an empty result image');
  }

  const buffer = Buffer.from(raw, 'base64');
  if (buffer.length < VTO_LIMITS.minResultBytes) {
    throw new Error('Google VTO result image is unexpectedly small');
  }

  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const width = Number(meta.width || 0);
  const height = Number(meta.height || 0);
  const longEdge = Math.max(width, height);

  if (!width || !height || longEdge < VTO_LIMITS.minResultLongEdgePx) {
    throw new Error(`Google VTO result image dimensions are invalid (${width}x${height})`);
  }

  return {
    bytes: buffer.length,
    width,
    height,
    mimeType: meta.format === 'jpeg' ? 'image/jpeg' : 'image/png',
  };
}

function buildParameters() {
  const sampleCount = clamp(Number(config.google.vto.sampleCount || DEFAULT_PRESET.sampleCount), 1, 4);
  const outputMimeType = String(config.google.vto.outputMimeType || DEFAULT_PRESET.outputMimeType).toLowerCase();

  const outputOptions = { mimeType: outputMimeType };
  if (outputMimeType === 'image/jpeg' || outputMimeType === 'image/jpg') {
    outputOptions.compressionQuality = clamp(Number(config.google.vto.jpegQuality || 95), 70, 100);
  }

  const configuredSteps = Number(config.google.vto.baseSteps);
  const baseSteps = Number.isFinite(configuredSteps) && configuredSteps > 0
    ? Math.max(DEFAULT_PRESET.minBaseSteps, configuredSteps)
    : DEFAULT_PRESET.minBaseSteps;

  return {
    sampleCount,
    addWatermark: Boolean(config.google.vto.addWatermark),
    outputOptions,
    baseSteps,
    safetySetting: String(config.google.vto.safetySetting || DEFAULT_PRESET.safetySetting),
  };
}

async function generateTryOnFromUrls({ modelImageUrl, garmentImageUrl }) {
  markLocalQuotaUsage();

  const endpoint = getEndpoint();
  const token = await getAccessToken();

  const [personRaw, garmentRaw] = await Promise.all([
    fetchBinary(modelImageUrl, 'person'),
    fetchBinary(garmentImageUrl, 'garment'),
  ]);

  const personImage = await preprocessForVto(ensureBuffer(personRaw), 'person');
  const garmentImage = await preprocessForVto(ensureBuffer(garmentRaw), 'garment');

  const payload = {
    instances: [
      {
        personImage: {
          image: {
            bytesBase64Encoded: personImage.buffer.toString('base64'),
          },
        },
        productImages: [
          {
            image: {
              bytesBase64Encoded: garmentImage.buffer.toString('base64'),
            },
          },
        ],
      },
    ],
    parameters: buildParameters(),
  };

  const { signal, clear } = getTimeoutSignal(clamp(Number(config.google.vto.timeoutMs || 45000), 15000, 120000));

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      const timeoutErr = new Error('Google VTO request timed out');
      timeoutErr.code = 'VTO_TIMEOUT';
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }
    throw error;
  } finally {
    clear();
  }

  const bodyText = await response.text();
  let body = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    const retryAfter = Number(response.headers.get('retry-after')) || null;
    const errMessage = body && body.error ? JSON.stringify(body.error) : `Google VTO request failed (${response.status})`;
    const error = new Error(errMessage);
    error.statusCode = response.status;
    error.code = response.status === 429 ? 'VTO_QUOTA_EXCEEDED' : 'VTO_REQUEST_FAILED';
    if (retryAfter) error.retryAfterSec = retryAfter;
    throw error;
  }

  const normalized = pickBestPrediction(body.predictions);
  if (!normalized || !normalized.resultBase64) {
    throw new Error('Google VTO did not return a valid image result');
  }

  const resultMeta = await validateResultImage(normalized.resultBase64);

  return {
    provider: 'google_vto',
    resultBase64: normalized.resultBase64,
    mimeType: normalized.mimeType || resultMeta.mimeType || 'image/png',
    resultMeta,
    inputMeta: {
      person: { width: personImage.width, height: personImage.height },
      garment: { width: garmentImage.width, height: garmentImage.height },
    },
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
  preprocessForVto,
  validateResultImage,
  buildParameters,
};
