const config = require('../config');
const { supabase } = require('./supabase');
const {
  isRemoteUrl,
  createSignedUrl,
  uploadFromUrl,
} = require('./storage');
const fashn = require('./fashn');

const CONCURRENCY = 5;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [5000, 15000, 45000];

const queue = [];
const queuedIds = new Set();
let started = false;
let inFlight = 0;

function mergeMetadata(base, patch) {
  return {
    ...(base && typeof base === 'object' ? base : {}),
    ...(patch && typeof patch === 'object' ? patch : {}),
  };
}

function enqueue(sessionId, attempt = 1, delayMs = 0) {
  if (!sessionId) return;
  const add = () => {
    if (queuedIds.has(sessionId)) return;
    queuedIds.add(sessionId);
    queue.push({ sessionId, attempt });
    drain();
  };

  if (delayMs > 0) {
    setTimeout(add, delayMs).unref();
    return;
  }
  add();
}

async function claimPendingSession(sessionId) {
  const { data, error } = await supabase
    .from('tryon_sessions')
    .update({ status: 'processing' })
    .eq('id', sessionId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getProduct(session) {
  const { data, error } = await supabase
    .from('products')
    .select('id, garment_image_url, category')
    .eq('id', session.product_id)
    .eq('shop_id', session.shop_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function resolvePersonImageForFashn(session) {
  const value = session.person_image_url;
  if (!value) throw new Error('Missing person image reference');
  if (isRemoteUrl(value)) return value;
  return createSignedUrl(config.storage.uploadsBucket, value, 60 * 60);
}

function resultStoragePath(session) {
  return `${session.shop_id}/${session.id}.jpg`;
}

async function completeSession(session, storedPath, completionTimeMs, predictionId) {
  const metadata = mergeMetadata(session.metadata, { completion_time_ms: completionTimeMs });
  const { error } = await supabase
    .from('tryon_sessions')
    .update({
      status: 'completed',
      result_image_url: storedPath,
      completed_at: new Date().toISOString(),
      fashn_prediction_id: predictionId || session.fashn_prediction_id || null,
      metadata,
    })
    .eq('id', session.id);
  if (error) throw error;
}

async function persistPredictionId(sessionId, predictionId) {
  if (!predictionId) return;
  const { error } = await supabase
    .from('tryon_sessions')
    .update({ fashn_prediction_id: predictionId })
    .eq('id', sessionId);
  if (error) throw error;
}

async function failOrRetrySession(session, attempt, errorMessage) {
  const nextAttempt = attempt + 1;
  if (nextAttempt <= MAX_RETRIES) {
    const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)] || 5000;
    const metadata = mergeMetadata(session.metadata, {
      retry_count: nextAttempt - 1,
      last_error: errorMessage,
      next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
    });

    const { error } = await supabase
      .from('tryon_sessions')
      .update({
        status: 'pending',
        metadata,
      })
      .eq('id', session.id);
    if (error) throw error;
    enqueue(session.id, nextAttempt, delayMs);
    return;
  }

  const metadata = mergeMetadata(session.metadata, {
    retry_count: attempt,
    last_error: errorMessage,
  });
  const { error } = await supabase
    .from('tryon_sessions')
    .update({
      status: 'failed',
      metadata,
      completed_at: new Date().toISOString(),
    })
    .eq('id', session.id);
  if (error) throw error;
}

async function processJob(job) {
  const { sessionId, attempt } = job;
  const claimed = await claimPendingSession(sessionId);
  if (!claimed) {
    return;
  }

  const metadata = claimed.metadata && typeof claimed.metadata === 'object' ? claimed.metadata : {};
  if (metadata.next_attempt_at) {
    const nextAt = new Date(metadata.next_attempt_at).getTime();
    if (Number.isFinite(nextAt) && nextAt > Date.now()) {
      await supabase
        .from('tryon_sessions')
        .update({ status: 'pending' })
        .eq('id', claimed.id);
      enqueue(claimed.id, attempt, Math.max(1000, nextAt - Date.now()));
      return;
    }
  }

  const startedAt = Date.now();
  try {
    const product = await getProduct(claimed);
    if (!product || !product.garment_image_url) {
      throw new Error('Product missing garment image');
    }

    const modelImage = await resolvePersonImageForFashn(claimed);
    const predictionId = claimed.fashn_prediction_id || await fashn.run({
      modelImage,
      garmentImage: product.garment_image_url,
      category: product.category,
    });
    if (!claimed.fashn_prediction_id && predictionId) {
      await persistPredictionId(claimed.id, predictionId);
    }

    const prediction = await fashn.pollUntilComplete(predictionId);
    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!outputUrl) throw new Error('FASHN output is empty');

    const storedPath = await uploadFromUrl(
      config.storage.resultsBucket,
      resultStoragePath(claimed),
      outputUrl,
    );

    await completeSession(claimed, storedPath, Date.now() - startedAt, predictionId);
  } catch (err) {
    await failOrRetrySession(claimed, attempt, err.message || 'Try-on processing failed');
  }
}

function drain() {
  if (!started) return;
  while (inFlight < CONCURRENCY && queue.length > 0) {
    const job = queue.shift();
    queuedIds.delete(job.sessionId);
    inFlight += 1;
    processJob(job)
      .catch((err) => {
        console.error('tryon worker job failed:', err.message);
      })
      .finally(() => {
        inFlight -= 1;
        drain();
      });
  }
}

function start() {
  if (started) return;
  started = true;

  // Recover pending jobs after restart.
  setImmediate(async () => {
    try {
      const { error: staleError } = await supabase
        .from('tryon_sessions')
        .update({ status: 'pending' })
        .eq('status', 'processing')
        .is('completed_at', null)
        .select('id');
      if (staleError) throw staleError;

      const { data, error } = await supabase
        .from('tryon_sessions')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      for (const row of data || []) {
        enqueue(row.id, 1);
      }
    } catch (err) {
      console.warn('tryon worker recovery skipped:', err.message);
    }
  });
}

function stop() {
  started = false;
}

function getStats() {
  return {
    queued: queue.length,
    inFlight,
    concurrency: CONCURRENCY,
    started,
  };
}

module.exports = {
  start,
  stop,
  enqueue,
  getStats,
};
