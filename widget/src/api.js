// Thin fetch wrapper for the FashionFit public widget API.
export function createApi(config) {
  const headers = { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' };

  async function request(path, options = {}) {
    const res = await fetch(config.apiUrl + path, { headers, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Żądanie nie powiodło się (${res.status})`);
    return data;
  }

  return {
    getProducts() {
      return request(`/api/widget/products/${config.shopId}`);
    },
    startPhotoTryon(productId, personImageBase64, metadata) {
      return request('/api/widget/tryon/photo', {
        method: 'POST',
        body: JSON.stringify({ shopId: config.shopId, productId, personImageBase64, metadata }),
      });
    },
    getTryonStatus(sessionId) {
      return request(`/api/widget/tryon/status/${sessionId}`);
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
