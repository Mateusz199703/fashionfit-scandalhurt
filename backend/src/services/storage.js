const fetch = require('node-fetch');
const { supabase } = require('./supabase');

function normalizeBase64(base64) {
  return String(base64 || '').includes(',') ? String(base64).split(',').pop() : String(base64 || '');
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

async function uploadBuffer(bucket, pathname, buffer, contentType = 'image/jpeg') {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(pathname, buffer, { contentType, upsert: true });
  if (error) throw error;
  return pathname;
}

async function uploadBase64(bucket, pathname, base64, contentType = 'image/jpeg') {
  const raw = normalizeBase64(base64);
  const buffer = Buffer.from(raw, 'base64');
  return uploadBuffer(bucket, pathname, buffer, contentType);
}

async function uploadFromUrl(bucket, pathname, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return uploadBuffer(bucket, pathname, buffer, contentType);
}

async function createSignedUrl(bucket, pathname, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathname, expiresInSeconds);
  if (error) throw error;
  if (!data || !data.signedUrl) {
    throw new Error('Could not generate signed URL');
  }
  return data.signedUrl;
}

module.exports = {
  isRemoteUrl,
  uploadBase64,
  uploadFromUrl,
  createSignedUrl,
};
