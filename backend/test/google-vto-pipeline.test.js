const test = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');

const {
  preprocessForVto,
  validateResultImage,
  segmentGarmentForeground,
  keepLargestConnectedComponent,
} = require('../src/services/googleVto');
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

test('keepLargestConnectedComponent keeps only largest foreground island', () => {
  const width = 10;
  const height = 6;
  const mask = Buffer.alloc(width * height);

  // Big block: 3x3
  for (let y = 1; y <= 3; y += 1) {
    for (let x = 1; x <= 3; x += 1) {
      mask[y * width + x] = 255;
    }
  }

  // Small block: 2x2
  for (let y = 1; y <= 2; y += 1) {
    for (let x = 7; x <= 8; x += 1) {
      mask[y * width + x] = 255;
    }
  }

  const filtered = keepLargestConnectedComponent(mask, width, height, 42);
  let leftCount = 0;
  let rightCount = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = filtered[y * width + x];
      if (x <= 4) leftCount += value > 0 ? 1 : 0;
      if (x >= 6) rightCount += value > 0 ? 1 : 0;
    }
  }

  assert.ok(leftCount >= 9, 'largest component should remain');
  assert.equal(rightCount, 0, 'smaller disconnected component should be removed');
});

test('segmentGarmentForeground removes detached accessory-like island', async () => {
  const canvas = sharp({
    create: {
      width: 1200,
      height: 1600,
      channels: 3,
      background: '#ffffff',
    },
  });

  const garment = await sharp({
    create: {
      width: 520,
      height: 1050,
      channels: 3,
      background: '#111111',
    },
  }).png().toBuffer();

  const detachedAccessory = await sharp({
    create: {
      width: 130,
      height: 130,
      channels: 3,
      background: '#d10f0f',
    },
  }).png().toBuffer();

  const input = await canvas
    .composite([
      { input: garment, left: 320, top: 300 },
      { input: detachedAccessory, left: 940, top: 1040 },
    ])
    .png()
    .toBuffer();

  const segmented = await segmentGarmentForeground(input);
  const raw = await sharp(segmented).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = raw.info;

  let alphaNearAccessory = 0;
  let alphaOnGarment = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const a = raw.data[idx + 3];
      if (x > Math.floor(width * 0.78) && y > Math.floor(height * 0.58)) alphaNearAccessory += a;
      if (x > Math.floor(width * 0.34) && x < Math.floor(width * 0.58) && y > Math.floor(height * 0.30) && y < Math.floor(height * 0.80)) {
        alphaOnGarment += a;
      }
    }
  }

  assert.ok(alphaOnGarment > 1000000, 'main garment must stay visible');
  assert.ok(alphaNearAccessory < 50000, 'detached accessory area should be mostly transparent');
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
