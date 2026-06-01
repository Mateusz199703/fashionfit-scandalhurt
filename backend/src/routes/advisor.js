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
  validateAdvisorChatPayload,
  resolveConversation,
  insertMessage,
  fetchShopProducts,
  fetchAdvisorSettings,
  fetchConversationContext,
  resolveAdvisorOutcome,
  buildSuccessResponse,
  buildLockedModuleResponse,
  filterCatalogProducts,
  validateRecommendationsAreCatalogOnly,
  normalizeAdvisorSettings,
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
  const aiClient = options.aiClient || null;

  router.use(authMiddleware);

  router.post('/chat', async (req, res) => {
    const { shopId, message, conversationId } = validateAdvisorChatPayload(req.body || {});

    let mockShop = null;
    if (useMockBackend) {
      mockShop = getMockShopFn(shopId, req.clientId);
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
    let conversationMessages = [];
    let advisorSettings;

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

      conversationMessages = mockState.messages
        .filter((item) => String(item.conversationId) === String(resolvedConversationId))
        .slice(-6)
        .map((item) => ({ role: item.role, content: item.content }));

      mockState.messages.push({
        id: randomUUID(),
        conversationId: resolvedConversationId,
        role: 'user',
        content: message,
        recommendationProductIds: [],
      });

      advisorSettings = normalizeAdvisorSettings(mockShop && mockShop.widget_config && mockShop.widget_config.advisor);
    } else {
      const conversation = await resolveConversation({
        db,
        clientId: req.clientId,
        shopId,
        conversationId,
      });
      resolvedConversationId = conversation.id;

      conversationMessages = await fetchConversationContext({
        db,
        conversationId: resolvedConversationId,
        limit: 6,
      });

      await insertMessage({
        db,
        conversationId: resolvedConversationId,
        role: 'user',
        content: message,
      });

      advisorSettings = await fetchAdvisorSettings({
        db,
        shopId,
        clientId: req.clientId,
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

    const outcome = await resolveAdvisorOutcome({
      message,
      shopId,
      catalogProducts,
      advisorSettings,
      conversationMessages,
      aiClient,
    });

    validateRecommendationsAreCatalogOnly(outcome.recommendations, catalogProducts, shopId);

    let assistantMessageId;
    if (useMockBackend) {
      assistantMessageId = randomUUID();
      mockState.messages.push({
        id: assistantMessageId,
        conversationId: resolvedConversationId,
        role: 'assistant',
        content: outcome.reply,
        recommendationProductIds: outcome.recommendations.map((item) => item.productId),
      });
    } else {
      const assistantMessage = await insertMessage({
        db,
        conversationId: resolvedConversationId,
        role: 'assistant',
        content: outcome.reply,
        recommendationProductIds: outcome.recommendations.map((item) => item.productId),
      });
      assistantMessageId = assistantMessage.id;
    }

    return res.json(buildSuccessResponse({
      conversationId: resolvedConversationId,
      assistantMessageId,
      shopId,
      recommendations: outcome.recommendations,
      reply: outcome.reply,
      maxResults: outcome.maxRecommendations,
      responseType: outcome.responseType,
      intentSubtype: outcome.intentSubtype || null,
    }));
  });

  return router;
}

const defaultRouter = createAdvisorRouter();

module.exports = defaultRouter;
module.exports.createAdvisorRouter = createAdvisorRouter;
