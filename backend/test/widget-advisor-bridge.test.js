const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

function loadWidgetRouterWithMocks() {
  const widgetPath = require.resolve('../src/routes/widget');
  const authPath = require.resolve('../src/middleware/auth');
  const advisorPath = require.resolve('../src/routes/advisor');
  const tryonPath = require.resolve('../src/routes/tryon');

  const saved = new Map();
  const save = (p) => saved.set(p, require.cache[p]);
  const restore = () => {
    for (const [p, entry] of saved.entries()) {
      if (entry) require.cache[p] = entry;
      else delete require.cache[p];
    }
    delete require.cache[widgetPath];
  };

  save(authPath);
  save(advisorPath);
  save(tryonPath);
  save(widgetPath);

  require.cache[authPath] = {
    id: authPath,
    filename: authPath,
    loaded: true,
    exports: {
      authenticateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        if (apiKey !== 'valid-key') {
          return res.status(401).json({
            error: 'Missing X-API-Key header',
            message: 'Missing X-API-Key header',
            code: 'API_KEY_MISSING',
          });
        }
        req.clientId = 'client-1';
        req.client = {
          id: 'client-1',
          plan: String(req.headers['x-test-plan'] || 'PRO').toUpperCase(),
        };
        req.apiKey = { scopes: ['widget'] };
        return next();
      },
      requireScope(scope) {
        return (req, res, next) => {
          const scopes = req.apiKey && Array.isArray(req.apiKey.scopes) ? req.apiKey.scopes : [];
          if (!scopes.includes(scope)) {
            return res.status(403).json({
              error: `API key is missing required scope: ${scope}`,
              message: `API key is missing required scope: ${scope}`,
              code: 'SCOPE_REQUIRED',
            });
          }
          return next();
        };
      },
    },
  };

  require.cache[advisorPath] = {
    id: advisorPath,
    filename: advisorPath,
    loaded: true,
    exports: {
      createAdvisorRouter(options = {}) {
        const router = express.Router();
        const authMiddleware = options.authMiddleware || ((req, res, next) => next());
        router.use(authMiddleware);
        router.post('/chat', (req, res) => {
          const body = req.body || {};
          if (!body.shopId || !body.message) {
            return res.status(400).json({
              error: 'shopId and message are required',
              message: 'shopId and message are required',
              code: 'VALIDATION_ERROR',
            });
          }

          if (String(body.shopId) !== 'owned-shop') {
            return res.status(403).json({
              error: 'Shop does not belong to this client',
              message: 'Shop does not belong to this client',
              code: 'SHOP_FORBIDDEN',
            });
          }

          if (String(req.client && req.client.plan).toUpperCase() === 'STARTER') {
            return res.status(403).json({
              error: 'Advisor module is locked for this shop',
              message: 'Advisor module is locked for this shop',
              code: 'MODULE_LOCKED',
              upgrade: {
                requiredModule: 'ai_stylist_advisor',
                action: 'upgrade_plan',
              },
            });
          }

          return res.json({
            conversationId: '00000000-0000-4000-8000-000000000111',
            assistantMessageId: '00000000-0000-4000-8000-000000000222',
            reply: 'Oto rekomendacje z Twojego katalogu sklepu.',
            recommendations: [],
            meta: {
              shopId: body.shopId,
              resultCount: 0,
              maxResults: 3,
              module: 'ai_stylist_advisor',
            },
          });
        });
        return router;
      },
    },
  };

  require.cache[tryonPath] = {
    id: tryonPath,
    filename: tryonPath,
    loaded: true,
    exports: express.Router(),
  };

  delete require.cache[widgetPath];
  const router = require(widgetPath);
  restore();
  return router;
}

async function requestWidgetAdvisor(router, { method = 'POST', headers = {}, body = null } = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/widget', router);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/widget/advisor/chat`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  await new Promise((resolve) => server.close(resolve));
  return { status: response.status, payload };
}

test('widget advisor bridge rejects request without valid widget API key', async () => {
  const router = loadWidgetRouterWithMocks();
  const result = await requestWidgetAdvisor(router, {
    body: { shopId: 'owned-shop', message: 'hej' },
  });

  assert.equal(result.status, 401);
  assert.equal(result.payload.code, 'API_KEY_MISSING');
});

test('widget advisor bridge passes through MODULE_LOCKED response', async () => {
  const router = loadWidgetRouterWithMocks();
  const result = await requestWidgetAdvisor(router, {
    headers: {
      'X-API-Key': 'valid-key',
      'X-Test-Plan': 'STARTER',
    },
    body: { shopId: 'owned-shop', message: 'szukam sukienki' },
  });

  assert.equal(result.status, 403);
  assert.equal(result.payload.code, 'MODULE_LOCKED');
  assert.equal(result.payload.upgrade.requiredModule, 'ai_stylist_advisor');
});

test('widget advisor bridge does not bypass shop/module access checks', async () => {
  const router = loadWidgetRouterWithMocks();
  const result = await requestWidgetAdvisor(router, {
    headers: { 'X-API-Key': 'valid-key' },
    body: { shopId: 'foreign-shop', message: 'szukam sukienki' },
  });

  assert.equal(result.status, 403);
  assert.equal(result.payload.code, 'SHOP_FORBIDDEN');
});
