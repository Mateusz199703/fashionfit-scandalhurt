const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

function loadWidgetRouterForSync({ isOwned = true } = {}) {
  const widgetPath = require.resolve('../src/routes/widget');
  const authPath = require.resolve('../src/middleware/auth');
  const ownershipPath = require.resolve('../src/services/ownership');
  const moduleAccessPath = require.resolve('../src/services/moduleAccess');
  const onboardingPath = require.resolve('../src/services/onboarding');
  const mockStorePath = require.resolve('../src/services/mockStore');
  const tryonPath = require.resolve('../src/routes/tryon');
  const advisorPath = require.resolve('../src/routes/advisor');
  const supabasePath = require.resolve('../src/services/supabase');

  const capturedUpserts = [];

  const saved = new Map();
  const save = (p) => saved.set(p, require.cache[p]);
  const restore = () => {
    for (const [p, entry] of saved.entries()) {
      if (entry) require.cache[p] = entry;
      else delete require.cache[p];
    }
    delete require.cache[widgetPath];
  };

  [
    widgetPath,
    authPath,
    ownershipPath,
    moduleAccessPath,
    onboardingPath,
    mockStorePath,
    tryonPath,
    advisorPath,
    supabasePath,
  ].forEach(save);

  require.cache[authPath] = {
    id: authPath,
    filename: authPath,
    loaded: true,
    exports: {
      authenticateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        if (apiKey !== 'valid-key') {
          return res.status(401).json({ code: 'API_KEY_MISSING', message: 'Missing X-API-Key header' });
        }
        req.clientId = 'client-1';
        req.client = { id: 'client-1', plan: 'GROWTH' };
        req.apiKey = { scopes: ['widget'] };
        return next();
      },
      requireScope(scope) {
        return (req, res, next) => {
          if (!req.apiKey || !Array.isArray(req.apiKey.scopes) || !req.apiKey.scopes.includes(scope)) {
            return res.status(403).json({ code: 'SCOPE_REQUIRED' });
          }
          return next();
        };
      },
    },
  };

  require.cache[ownershipPath] = {
    id: ownershipPath,
    filename: ownershipPath,
    loaded: true,
    exports: {
      isShopOwnedByClient: async () => isOwned,
    },
  };

  require.cache[moduleAccessPath] = {
    id: moduleAccessPath,
    filename: moduleAccessPath,
    loaded: true,
    exports: {
      getModuleAccessSnapshot: async () => ({ modules: [] }),
    },
  };

  require.cache[onboardingPath] = {
    id: onboardingPath,
    filename: onboardingPath,
    loaded: true,
    exports: {
      markOnboardingProgressAsync() {},
    },
  };

  require.cache[mockStorePath] = {
    id: mockStorePath,
    filename: mockStorePath,
    loaded: true,
    exports: {
      isMockBackendEnabled: () => false,
      findMockShopForDomain: () => null,
      listMockProducts: () => [],
      upsertMockWidgetProducts: () => 0,
      deactivateMockWidgetProduct: () => false,
      trackMockAnalyticsEvent: () => false,
    },
  };

  require.cache[tryonPath] = {
    id: tryonPath,
    filename: tryonPath,
    loaded: true,
    exports: express.Router(),
  };

  require.cache[advisorPath] = {
    id: advisorPath,
    filename: advisorPath,
    loaded: true,
    exports: {
      createAdvisorRouter() {
        return express.Router();
      },
    },
  };

  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: {
      supabase: {
        from(table) {
          assert.equal(table, 'products');
          return {
            async upsert(rows) {
              capturedUpserts.push(rows);
              return { error: null };
            },
          };
        },
      },
    },
  };

  delete require.cache[widgetPath];
  const router = require(widgetPath);
  restore();
  return { router, capturedUpserts };
}

async function postSync(router, body, apiKey = 'valid-key') {
  const app = express();
  app.use(express.json());
  app.use('/api/widget', router);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/widget/products/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  await new Promise((resolve) => server.close(resolve));
  return { status: response.status, payload };
}

test('old widget sync payload still works and keeps backwards compatibility', async () => {
  const { router, capturedUpserts } = loadWidgetRouterForSync();
  const result = await postSync(router, {
    shopId: '11111111-1111-4111-8111-111111111111',
    products: [{
      external_id: 'woo-1',
      name: 'Sukienka midi',
      category: 'one-pieces',
      garment_image_url: 'https://shop.test/img.jpg',
      product_url: 'https://shop.test/p/sukienka',
      variants: { sizes: ['S', 'M'] },
    }],
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.synced, 1);
  assert.equal(capturedUpserts.length, 1);
  const row = capturedUpserts[0][0];
  assert.equal(row.external_id, 'woo-1');
  assert.equal(row.name, 'Sukienka midi');
  assert.equal(row.category, 'one-pieces');
  assert.equal(row.garment_image_url, 'https://shop.test/img.jpg');
  assert.equal(row.product_url, 'https://shop.test/p/sukienka');
  assert.deepEqual(row.variants, { sizes: ['S', 'M'] });
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'price'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'stock_status'), false);
});

test('rich widget sync payload is sanitized and stores product fact fields', async () => {
  const { router, capturedUpserts } = loadWidgetRouterForSync();
  const result = await postSync(router, {
    shopId: '11111111-1111-4111-8111-111111111111',
    products: [{
      external_id: 'woo-2',
      name: '  Sukienka premium  ',
      category: 'one-pieces',
      garment_image_url: 'https://shop.test/img2.jpg',
      product_url: 'https://shop.test/p/sukienka-2',
      price: '199.90',
      regular_price: '249.90',
      sale_price: '179.90',
      currency: ' pln ',
      stock_status: 'instock',
      stock_quantity: '12',
      is_in_stock: 'true',
      attributes: [{ name: 'Kolor', options: ['Czarny', 'Granat'] }],
      colors: [' Czarny ', 'Granat', ''],
      sizes: ['S', ' M '],
      material: '  Wiskoza ',
      description: 'Długa sukienka wieczorowa',
      short_description: 'Krótki opis',
      tags: [{ name: 'new' }, { slug: 'sale' }],
      gallery_images: ['https://shop.test/a.jpg', 'javascript:alert(1)'],
      variants: [{
        external_id: 'var-1',
        attributes: { size: 'M', color: 'Czarny' },
        price: '179.90',
        regular_price: '249.90',
        sale_price: '179.90',
        stock_status: 'instock',
        stock_quantity: 4,
        in_stock: true,
      }],
      source_updated_at: '2026-06-01T12:00:00Z',
    }],
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.synced, 1);
  const row = capturedUpserts[0][0];
  assert.equal(row.price, 199.9);
  assert.equal(row.regular_price, 249.9);
  assert.equal(row.sale_price, 179.9);
  assert.equal(row.currency, 'pln');
  assert.equal(row.stock_status, 'instock');
  assert.equal(row.stock_quantity, 12);
  assert.equal(row.is_in_stock, true);
  assert.equal(row.material, 'Wiskoza');
  assert.equal(row.description, 'Długa sukienka wieczorowa');
  assert.equal(row.short_description, 'Krótki opis');
  assert.deepEqual(row.colors, ['Czarny', 'Granat']);
  assert.deepEqual(row.sizes, ['S', 'M']);
  assert.equal(Array.isArray(row.variants), true);
  assert.equal(Array.isArray(row.gallery_images), true);
  assert.equal(row.gallery_images.length, 1);
  assert.equal(typeof row.source_updated_at, 'string');
});

test('partial payload does not wipe rich fields by forcing null assignments', async () => {
  const { router, capturedUpserts } = loadWidgetRouterForSync();
  const result = await postSync(router, {
    shopId: '11111111-1111-4111-8111-111111111111',
    products: [{ external_id: 'woo-3', name: 'Sukienka basic' }],
  });

  assert.equal(result.status, 200);
  const row = capturedUpserts[0][0];
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'price'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'regular_price'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'sale_price'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'attributes'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'colors'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(row, 'sizes'), false);
});

test('sync keeps shop ownership checks intact', async () => {
  const { router } = loadWidgetRouterForSync({ isOwned: false });
  const result = await postSync(router, {
    shopId: '11111111-1111-4111-8111-111111111111',
    products: [{ external_id: 'woo-4', name: 'Sukienka' }],
  });

  assert.equal(result.status, 403);
});
