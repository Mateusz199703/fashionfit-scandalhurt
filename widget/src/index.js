import { getConfig, isProductPage, getProductExternalId } from './utils.js';
import { injectStyles } from './styles.js';
import { createApi } from './api.js';
import { createWidget } from './ui.js';

// Captured synchronously so it resolves even when loaded with `async`.
const SCRIPT = document.currentScript;

async function init() {
  const config = getConfig(SCRIPT);
  if (!config.apiKey || !config.shopId) {
    console.warn('[FashionFit] Brak apiKey lub shopId — widget nie został uruchomiony.');
    return;
  }
  if (!isProductPage()) return;

  const externalId = getProductExternalId();
  injectStyles(config.primaryColor);
  const api = createApi(config);

  let product = null;
  if (externalId) {
    try {
      const { products } = await api.getProducts();
      product = (products || []).find((p) => String(p.external_id) === String(externalId)) || null;
    } catch (e) {
      console.warn('[FashionFit] Nie udało się pobrać produktów:', e.message);
    }
  }

  if (!product) {
    console.warn('[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id:', externalId);
    return;
  }

  createWidget({ config, api, product, externalId }).mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
