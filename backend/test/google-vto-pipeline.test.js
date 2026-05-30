const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const { preprocessForVto, validateResultImage } = require('../src/services/googleVto');
const { selectGarmentImage, scoreGarmentImageCandidate } = require('../src/services/woocommerce');

async function makeImage({ width, height, color = '#d0d0d0', format = 'jpeg' }) {
  const img = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  });

  if (format === 'png') return img.png().toBuffer();
  return img.jpeg({ quality: 95 }).toBuffer();
}

test('preprocessForVto normalizes person image to portrait ratio and max edge', async () => {
  const input = await makeImage({ width: 3200, height: 1800, color: '#b9c7ff' });
  const result = await preprocessForVto(input, 'person');

  assert.ok(result.buffer.length > 0);
  assert.ok(result.width > 0 && result.height > 0);
  assert.ok(Math.max(result.width, result.height) <= 2048);

  const ratio = result.width / result.height;
  assert.ok(Math.abs(ratio - (2 / 3)) < 0.03);
});

test('preprocessForVto trims garment-like image and keeps portrait canvas', async () => {
  const canvas = sharp({
    create: {
      width: 2200,
      height: 2200,
      channels: 3,
      background: '#ffffff',
    },
  });

  const garmentBlock = await sharp({
    create: {
      width: 1200,
      height: 1600,
      channels: 3,
      background: '#111111',
    },
  }).png().toBuffer();

  const composed = await canvas
    .composite([{ input: garmentBlock, left: 500, top: 300 }])
    .png()
    .toBuffer();

  const result = await preprocessForVto(composed, 'garment');
  const ratio = result.width / result.height;

  assert.ok(Math.max(result.width, result.height) <= 2048);
  assert.ok(Math.abs(ratio - (2 / 3)) < 0.03);
});

test('validateResultImage accepts solid valid PNG and rejects too-small payload', async () => {
  const ok = await makeImage({ width: 1024, height: 1536, color: '#666666', format: 'png' });
  const okMeta = await validateResultImage(ok.toString('base64'));
  assert.equal(okMeta.width, 1024);
  assert.equal(okMeta.height, 1536);

  await assert.rejects(() => validateResultImage(Buffer.from('tiny').toString('base64')));
});

test('selectGarmentImage prefers packshot-like asset over model/lifestyle image', () => {
  const images = [
    {
      src: 'https://cdn.store.com/products/dress-model-lifestyle.jpg',
      alt: 'Model wearing dress on street',
      name: 'lookbook',
      position: 0,
    },
    {
      src: 'https://cdn.store.com/products/dress-packshot-front-white.png',
      alt: 'Dress front on white background',
      name: 'packshot front',
      position: 1,
    },
  ];

  const selected = selectGarmentImage(images);
  assert.equal(selected, images[1].src);
  assert.ok(scoreGarmentImageCandidate(images[1]) < scoreGarmentImageCandidate(images[0]));
});
