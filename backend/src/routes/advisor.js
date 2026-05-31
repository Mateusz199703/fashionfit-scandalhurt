const express = require('express');
const { randomUUID } = require('crypto');
const { supabase } = require('../services/supabase');
const { authenticateJWT } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');
const { isShopOwnedByClient } = require('../services/ownership');
const { getModuleAccessSnapshot, isModuleEnabled } = require('../services/moduleAccess');
const {
  isMockBackendEnabled,
  getMockShop,
  listMockProducts,
} = require('../services/mockStore');
const {
  MAX_RECOMMENDATIONS,
  validateAdvisorChatPayload,
  selectTopRecommendations,
  resolveConversation,
  insertMessage,
  fetchShopProducts,
  buildSuccessResponse,
  buildLockedModuleResponse,
  filterCatalogProducts,
} = require('../services/advisor');

const defaultMockState = {
  conversations: new Map(),
  messages: [],
};

function createAdvisorRouter(options = {}) {
  const router = express.Router();
  const authMiddleware = options.authMiddleware || authenticateJWT;
  const db = options.db || supabase;
  const ownershipChecker = options.ownershipChecker || isShopOwnedByClient;
  const getModuleAccessSnapshotFn = options.getModuleAccessSnapshotFn || getModuleAccessSnapshot;
  const isModuleEnabledFn = options.isModuleEnabledFn || isModuleEnabled;
  const useMockBackend = options.useMockBackend != null ? options.useMockBackend : isMockBackendEnabled();
  const getMockShopFn = options.getMockShopFn || getMockShop;
  const listMockProductsFn = options.listMockProductsFn || listMockProducts;
  const mockState = options.mockState || defaultMockState;

  router.use(authMiddleware);

  router.post('/chat', async (req, res) => {
    const { shopId, message, conversationId } = validateAdvisorChatPayload(req.body || {});

    if (useMockBackend) {
      const mockShop = getMockShopFn(shopId, req.clientId);
      if (!mockShop) throw new ApiError(403, 'Shop does not belong to this client', 'SHOP_FORBIDDEN');
    } else {
      const owned = await ownershipChecker(shopId, req.clientId);
      if (!owned) throw new ApiError(403, 'Shop does not belong to this client', 'SHOP_FORBIDDEN');
    }

    const snapshot = await getModuleAccessSnapshotFn({
      clientId: req.clientId,
      plan: req.client && req.client.plan,
      shopId,
    });

    if (!isModuleEnabledFn(snapshot, 'ai_stylist_advisor')) {
      return res.status(403).json(buildLockedModuleResponse());
    }

    let resolvedConversationId;
    if (useMockBackend) {
      if (conversationId) {
        const existing = mockState.conversations.get(conversationId);
        if (!existing) throw new ApiError(404, 'Conversation not found', 'CONVERSATION_NOT_FOUND');
        if (String(existing.clientId) !== String(req.clientId) || String(existing.shopId) !== String(shopId)) {
          throw new ApiError(403, 'Conversation does not belong to this shop', 'CONVERSATION_FORBIDDEN');
        }
        resolvedConversationId = conversationId;
      } else {
        resolvedConversationId = randomUUID();
        mockState.conversations.set(resolvedConversationId, {
          id: resolvedConversationId,
          clientId: req.clientId,
          shopId,
        });
      }

      mockState.messages.push({
        id: randomUUID(),
        conversationId: resolvedConversationId,
        role: 'user',
        content: message,
        recommendationProductIds: [],
      });
    } else {
      const conversation = await resolveConversation({
        db,
        clientId: req.clientId,
        shopId,
        conversationId,
      });
      resolvedConversationId = conversation.id;

      await insertMessage({
        db,
        conversationId: resolvedConversationId,
        role: 'user',
        content: message,
      });
    }

    let products;
    if (useMockBackend) {
      const list = listMockProductsFn(shopId, req.clientId);
      if (!list) throw new ApiError(403, 'Shop does not belong to this client', 'SHOP_FORBIDDEN');
      products = list;
    } else {
      products = await fetchShopProducts({ db, shopId });
    }

    const catalogProducts = filterCatalogProducts(products, shopId);

    const recommendations = selectTopRecommendations(catalogProducts, message, MAX_RECOMMENDATIONS);

    for (const recommendation of recommendations) {
      const matched = catalogProducts.find((product) => String(product.id) === String(recommendation.productId));
      if (!matched || matched.shop_id == null || String(matched.shop_id) !== String(shopId)) {
        throw new ApiError(500, 'Catalog validation failed for recommended product', 'CATALOG_VALIDATION_FAILED');
      }
    }

    let assistantMessageId;
    if (useMockBackend) {
      assistantMessageId = randomUUID();
      mockState.messages.push({
        id: assistantMessageId,
        conversationId: resolvedConversationId,
        role: 'assistant',
        content: recommendations.length > 0
          ? `Znalazłam ${recommendations.length} propozycje z Twojego katalogu sklepu.`
          : 'Nie znalazłam pasujących produktów w katalogu tego sklepu.',
        recommendationProductIds: recommendations.map((item) => item.productId),
      });
    } else {
      const assistantMessage = await insertMessage({
        db,
        conversationId: resolvedConversationId,
        role: 'assistant',
        content: recommendations.length > 0
          ? `Znalazłam ${recommendations.length} propozycje z Twojego katalogu sklepu.`
          : 'Nie znalazłam pasujących produktów w katalogu tego sklepu.',
        recommendationProductIds: recommendations.map((item) => item.productId),
      });
      assistantMessageId = assistantMessage.id;
    }

    return res.json(buildSuccessResponse({
      conversationId: resolvedConversationId,
      assistantMessageId,
      shopId,
      recommendations,
    }));
  });

  return router;
}

const defaultRouter = createAdvisorRouter();

module.exports = defaultRouter;
module.exports.createAdvisorRouter = createAdvisorRouter;
