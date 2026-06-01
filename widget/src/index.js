import { getConfig, isProductPage, getProductExternalId, getPageProductInfo } from './utils.js';
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
  const onProductPage = isProductPage();

  const externalId = onProductPage ? getProductExternalId() : null;
  injectStyles(config.primaryColor);
  const api = createApi(config);

  let product = null;
  if (onProductPage && externalId) {
    try {
      const { products } = await api.getProducts();
      const list = products || [];
      product = list.find((p) => String(p.external_id) === String(externalId)) || null;
      if (!product) {
        const currentPath = location.pathname.replace(/\/+$/, '');
        product = list.find((p) => {
          if (!p.product_url) return false;
          try {
            const url = new URL(p.product_url);
            return url.pathname.replace(/\/+$/, '') === currentPath;
          } catch {
            return false;
          }
        }) || null;
      }
      if (!product) {
        const page = getPageProductInfo();
        const normalize = (value) => String(value || '').trim().toLowerCase();
        product = list.find((p) => normalize(p.name) === normalize(page.name)) || null;
      }
    } catch (e) {
      console.warn('[FashionFit] Nie udało się pobrać produktów:', e.message);
    }
  }

  if (!product) {
    if (onProductPage) {
      const page = getPageProductInfo();
      product = {
        id: externalId || `fallback:${location.pathname}`,
        external_id: externalId || null,
        name: page.name || 'Produkt',
        garment_image_url: page.image || null,
        product_url: location.href,
        category: 'tops',
        variants: null,
        _fallback: true,
      };
      console.warn('[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:', externalId);
    } else {
      product = {
        id: `global:${location.pathname || '/'}`,
        external_id: null,
        name: 'Lume · stylista AI',
        garment_image_url: null,
        product_url: null,
        category: null,
        variants: null,
        _fallback: true,
      };
    }
  }

  if (onProductPage && String(product.category || '').toLowerCase() === 'accessories') {
    console.info('[FashionFit] Pomijam widget try-on dla kategorii accessories.');
    return;
  }

  createWidget({ config, api, product, externalId }).mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
