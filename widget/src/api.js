// Thin fetch wrapper for the FashionFit public widget API.
export function createApi(config) {
  const headers = { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' };

  async function request(path, options = {}) {
    const res = await fetch(config.apiUrl + path, { headers, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || data.message || `Żądanie nie powiodło się (${res.status})`);
      err.status = res.status;
      err.code = data.code || null;
      err.payload = data;
      throw err;
    }
    return data;
  }

  return {
    getProducts() {
      return request(`/api/widget/products/${config.shopId}`);
    },
    startPhotoTryon(productId, personImageBase64, metadata) {
      return request('/api/widget/tryon/photo', {
        method: 'POST',
        body: JSON.stringify({
          shopId: config.shopId,
          productId,
          personImageBase64,
          preferredProvider: config.tryonProvider || 'auto',
          metadata: {
            ...(metadata || {}),
            preferredProvider: config.tryonProvider || 'auto',
          },
        }),
      });
    },
    getTryonStatus(sessionId) {
      return request(`/api/widget/tryon/status/${sessionId}`);
    },
    getModules() {
      return request(`/api/widget/modules/${config.shopId}`);
    },
    advisorChat(message, conversationId = null) {
      const payload = {
        shopId: config.shopId,
        message,
      };
      if (conversationId) payload.conversationId = conversationId;

      return request('/api/widget/advisor/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    // Fire-and-forget analytics; never let tracking break the UX.
    trackEvent(eventType, extra = {}) {
      return request('/api/widget/events', {
        method: 'POST',
        body: JSON.stringify({ shopId: config.shopId, eventType, ...extra }),
      }).catch(() => {});
    },
  };
}
