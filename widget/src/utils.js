// Tiny DOM builder: h('div', { class, onclick, style, html }, ...children)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else el.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

// Merge config from window.FashionFitConfig and the embedding <script> data-attrs.
export function getConfig(scriptEl) {
  const global = window.FashionFitConfig || {};
  const script = scriptEl || document.currentScript ||
    [...document.querySelectorAll('script[src*="widget"]')].pop();
  const data = (script && script.dataset) || {};
  return {
    apiKey: global.apiKey || data.fashionfitKey || null,
    shopId: global.shopId || data.fashionfitShop || null,
    apiUrl: (global.apiUrl || data.fashionfitApi || 'https://api.fashionfit.app').replace(/\/$/, ''),
    primaryColor: global.primaryColor || data.fashionfitColor || '#C4883A',
    buttonLabel: global.buttonLabel || data.fashionfitLabel || 'Przymierz wirtualnie ✨',
    tryonProvider: global.tryonProvider || data.fashionfitProvider || 'auto',
  };
}

export function isProductPage() {
  return /\/product\//.test(location.pathname) ||
    document.body.classList.contains('single-product') ||
    Boolean(document.querySelector('.product, .single-product'));
}

// Resolve the WooCommerce product id from common page markers.
export function getProductExternalId() {
  const bodyMatch = document.body.className.match(/postid-(\d+)/);
  if (bodyMatch) return bodyMatch[1];

  const productNode = document.querySelector('[id^="product-"]');
  if (productNode && productNode.id) {
    const idMatch = productNode.id.match(/^product-(\d+)$/);
    if (idMatch) return idMatch[1];
  }

  const meta = document.querySelector('meta[property="product:retailer_item_id"]');
  if (meta && meta.getAttribute('content')) return meta.getAttribute('content');

  const node = document.querySelector('[data-product_id], button[name="add-to-cart"][value]');
  if (node) return node.getAttribute('data-product_id') || node.getAttribute('value');

  return null;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) return 'Nie wybrano pliku';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Dozwolone formaty to JPG i PNG';
  if (file.size > MAX_BYTES) return 'Maksymalny rozmiar zdjęcia to 10MB';
  return null;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'));
    reader.readAsDataURL(file);
  });
}

export function analyzeImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const width = Number(img.naturalWidth || img.width || 0);
      const height = Number(img.naturalHeight || img.height || 0);
      const megapixels = width > 0 && height > 0 ? Number(((width * height) / 1000000).toFixed(2)) : 0;
      let bucket = 'unknown';
      if (megapixels >= 4.5) bucket = 'ultra';
      else if (megapixels >= 2.0) bucket = 'high';
      else if (megapixels >= 0.9) bucket = 'medium';
      else if (megapixels > 0) bucket = 'low';

      resolve({
        image_width: width,
        image_height: height,
        image_megapixels: megapixels,
        image_quality_bucket: bucket,
        output_quality: 'max',
      });
    };
    img.onerror = () => reject(new Error('Nie udało się odczytać rozdzielczości zdjęcia'));
    img.src = dataUrl;
  });
}

// Download a (possibly cross-origin) image by fetching it into a blob first.
export async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = h('a', { href: objectUrl, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    window.open(url, '_blank');
  }
}

export function getPageProductInfo() {
  const titleEl = document.querySelector('.product_title, h1.entry-title, h1');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  const galleryImg = document.querySelector('.woocommerce-product-gallery img, .wp-post-image');
  return {
    name: (titleEl && titleEl.textContent.trim()) || (ogTitle && ogTitle.content) || 'Produkt',
    image: (galleryImg && (galleryImg.currentSrc || galleryImg.src)) || (ogImage && ogImage.content) || null,
  };
}
