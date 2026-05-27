const crypto = require('crypto');
const config = require('../config');

function getKeyBuffer() {
  const hex = String(config.encryptionKey || '').trim();
  if (!/^[a-fA-F0-9]{64}$/.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(text) {
  if (text === null || text === undefined || text === '') return text;
  const iv = crypto.randomBytes(12);
  const key = getKeyBuffer();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decrypt(payload) {
  if (payload === null || payload === undefined || payload === '') return payload;
  const parts = String(payload).split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload format');

  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', getKeyBuffer(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

function looksEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function decryptMaybe(value) {
  if (!looksEncrypted(value)) return value;
  return decrypt(value);
}

function encryptFields(obj, fields = []) {
  const next = { ...(obj || {}) };
  for (const field of fields) {
    if (field in next && next[field] !== null && next[field] !== undefined && next[field] !== '') {
      next[field] = encrypt(next[field]);
    }
  }
  return next;
}

function decryptFields(obj, fields = []) {
  const next = { ...(obj || {}) };
  for (const field of fields) {
    if (field in next && next[field] !== null && next[field] !== undefined && next[field] !== '') {
      next[field] = decryptMaybe(next[field]);
    }
  }
  return next;
}

module.exports = {
  encrypt,
  decrypt,
  decryptMaybe,
  encryptFields,
  decryptFields,
};
