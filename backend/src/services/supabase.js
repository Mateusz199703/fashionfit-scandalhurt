const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const config = require('../config');

const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Upload a (possibly data-URL) base64 image and return its public URL.
async function uploadBase64Image(bucket, pathname, base64, contentType = 'image/jpeg') {
  const raw = base64.includes(',') ? base64.split(',').pop() : base64;
  const buffer = Buffer.from(raw, 'base64');
  const { error } = await supabase.storage
    .from(bucket)
    .upload(pathname, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(pathname).data.publicUrl;
}

// Download a remote image and re-host it in Supabase Storage; return public URL.
async function uploadImageFromUrl(bucket, pathname, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const { error } = await supabase.storage
    .from(bucket)
    .upload(pathname, buffer, { contentType, upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(pathname).data.publicUrl;
}

module.exports = { supabase, uploadBase64Image, uploadImageFromUrl };
