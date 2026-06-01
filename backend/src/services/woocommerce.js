const fetch = require('node-fetch');
const { supabase } = require('./supabase');
const { URL } = require('url');

// Best-effort mapping of WooCommerce category names/slugs to FashionFit categories.
function mapCategory(wcCategories = []) {
  const labels = wcCategories.map((c) => `${c.slug || ''} ${c.name || ''}`.toLowerCase());
  for (const label of labels) {
    if (/(t-?shirt|shirt|top|bluz|sweter|sweat|koszul|hoodie)/.test(label)) return 'tops';
    if (/(jean|spodnie|pants|trouser|short|skirt|spódnic|legging|bottom)/.test(label)) return 'bottoms';
    if (/(dress|sukienk|jumpsuit|kombinezon|one-?piece|romper|overall)/.test(label)) return 'one-pieces';
    if (/(jacket|coat|kurtk|płaszcz|outer|blazer|parka)/.test(label)) return 'outerwear';
    if (/(accessor|akcesor|bag|torb|hat|czapk|belt|pasek|scarf|szalik|jewel)/.test(label)) return 'accessories';
  }
  return 'tops';
}

function baseUrl(shop) {
  const domain = shop.domain || '';
  return domain.startsWith('http') ? domain : `https://${domain}`;
}

function sanitizeLabel(value) {
  return String(value || '').trim().toLowerCase();
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100) / 100;
}

function toInteger(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function toIsoTimestamp(value) {
  if (!value) return null;
  const parsed = Date.parse(String(value));
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

function normalizeUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value));
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch (_) {
    return null;
  }
}

function normalizeList(values, maxItems = 64, maxLen = 120) {
  if (!Array.isArray(values)) return null;
  const out = [];
  for (const value of values.slice(0, maxItems)) {
    const clean = String(value || '').trim();
    if (!clean) continue;
    out.push(clean.slice(0, maxLen));
  }
  return out.length > 0 ? out : null;
}

function normalizeAttributes(attributes = []) {
  if (!Array.isArray(attributes)) return null;
  const out = [];
  for (const attr of attributes.slice(0, 80)) {
    if (!attr || typeof attr !== 'object') continue;
    const name = String(attr.name || '').trim();
    const slug = String(attr.slug || '').trim();
    const options = normalizeList(attr.options || [], 80, 120);
    const entry = {
      id: toInteger(attr.id),
      name: name || null,
      slug: slug || null,
      visible: typeof attr.visible === 'boolean' ? attr.visible : null,
      variation: typeof attr.variation === 'boolean' ? attr.variation : null,
      options,
    };
    if (entry.name || entry.slug || (entry.options && entry.options.length > 0)) {
      out.push(entry);
    }
  }
  return out.length > 0 ? out : null;
}

function extractAttributeOptions(attributes, patterns) {
  const list = Array.isArray(attributes) ? attributes : [];
  const out = new Set();
  for (const attr of list) {
    const hay = `${String(attr && attr.name || '').toLowerCase()} ${String(attr && attr.slug || '').toLowerCase()}`;
    if (!patterns.some((pattern) => pattern.test(hay))) continue;
    for (const option of attr.options || []) {
      const value = String(option || '').trim();
      if (value) out.add(value);
    }
  }
  return [...out];
}

function extractMaterial(attributes = [], description = '', shortDescription = '') {
  const fromAttributes = extractAttributeOptions(attributes, [/(materia|fabric|material|skład|sklad)/i]);
  if (fromAttributes.length > 0) return fromAttributes[0];

  const hay = `${String(description || '')} ${String(shortDescription || '')}`;
  const match = hay.match(/\b(bawełna|bawelna|wełna|welna|wiskoza|len|jedwab|poliester|akryl|lyocell|modal)\b/i);
  return match ? match[1] : null;
}

function mapGalleryImages(images = []) {
  if (!Array.isArray(images)) return null;
  const out = [];
  for (const image of images.slice(0, 32)) {
    const src = normalizeUrl(image && image.src);
    if (!src) continue;
    out.push({
      src,
      alt: String(image && image.alt || '').trim() || null,
      name: String(image && image.name || '').trim() || null,
      position: toInteger(image && image.position),
    });
  }
  return out.length > 0 ? out : null;
}

function mapTags(tags = []) {
  if (!Array.isArray(tags)) return null;
  const out = [];
  for (const tag of tags.slice(0, 64)) {
    if (!tag || typeof tag !== 'object') continue;
    const name = String(tag.name || '').trim();
    const slug = String(tag.slug || '').trim();
    if (!name && !slug) continue;
    out.push({ id: toInteger(tag.id), name: name || null, slug: slug || null });
  }
  return out.length > 0 ? out : null;
}

function mapVariants(product) {
  if (Array.isArray(product && product.variations) && product.variations.length > 0) {
    // TODO(M6.4B-2): fetch full variation payloads with pagination and map per-variant
    // price/stock/attributes. M6.4B-1 keeps backward-compatible variation id mapping.
    return { variation_ids: product.variations.slice(0, 200).map((id) => String(id)) };
  }
  return null;
}

function mapProductToSyncRow(product, shop) {
  const attributes = normalizeAttributes(product.attributes);
  const colors = extractAttributeOptions(attributes || [], [/(kolor|color|barwa)/i]);
  const sizes = extractAttributeOptions(attributes || [], [/(rozmiar|size)/i]);
  const description = String(product.description || '').trim() || null;
  const shortDescription = String(product.short_description || '').trim() || null;

  return {
    shop_id: shop.id,
    external_id: String(product.id),
    name: product.name || null,
    category: mapCategory(product.categories),
    garment_image_url: selectGarmentImage(product.images),
    product_url: normalizeUrl(product.permalink),
    variants: mapVariants(product),
    price: toFiniteNumber(product.price),
    regular_price: toFiniteNumber(product.regular_price),
    sale_price: toFiniteNumber(product.sale_price),
    currency: String(product.currency || shop.currency || '').trim() || null,
    stock_status: String(product.stock_status || '').trim() || null,
    stock_quantity: toInteger(product.stock_quantity),
    is_in_stock: typeof product.in_stock === 'boolean' ? product.in_stock : null,
    attributes,
    colors: colors.length > 0 ? colors : null,
    sizes: sizes.length > 0 ? sizes : null,
    material: extractMaterial(attributes || [], description, shortDescription),
    description,
    short_description: shortDescription,
    tags: mapTags(product.tags),
    gallery_images: mapGalleryImages(product.images),
    source_updated_at: toIsoTimestamp(product.date_modified_gmt || product.date_modified),
    is_synced: true,
    last_synced_at: new Date().toISOString(),
  };
}

function scoreGarmentImageCandidate(image) {
  const src = sanitizeLabel(image && image.src);
  const name = sanitizeLabel(image && image.name);
  const alt = sanitizeLabel(image && image.alt);
  const label = `${name} ${alt} ${src}`;
  let score = 0;

  if (!src) return Number.POSITIVE_INFINITY;

  // Prefer clean packshots/front-only garment photos.
  if (/(flat|flatlay|packshot|ghost|front|studio|cutout|white|biale|na-bialym)/.test(label)) score -= 4;
  if (/(detail|zoom|back|tyl|bok|side|lifestyle|lookbook|campaign|model|on-model|street)/.test(label)) score += 5;
  if (/(toreb|bag|hat|jewel|kolczyk|necklace|bracelet|belt|pasek|szalik|scarf)/.test(label)) score += 6;
  if (/\.(png)(\?|$)/.test(src)) score -= 1;

  // Lower position in Woo gallery often means more editorial angle; prefer first slots.
  const position = Number(image && image.position);
  if (Number.isFinite(position)) score += Math.min(position, 8) * 0.6;

  return score;
}

function selectGarmentImage(images = []) {
  if (!Array.isArray(images) || !images.length) return null;
  const sorted = images
    .filter((img) => img && img.src)
    .map((img) => ({ img, score: scoreGarmentImageCandidate(img) }))
    .sort((a, b) => a.score - b.score);

  if (!sorted.length) return null;
  return sorted[0].img.src || null;
}

async function fetchProducts(shop, { perPage = 100, maxPages = 50 } = {}) {
  const auth = Buffer.from(`${shop.wc_consumer_key}:${shop.wc_consumer_secret}`).toString('base64');
  const all = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = `${baseUrl(shop)}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      throw new Error(`WooCommerce fetch failed (${res.status})`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
  }
  return all;
}

async function syncShopProducts(shop) {
  const products = await fetchProducts(shop);

  const rows = products.map((p) => mapProductToSyncRow(p, shop));

  if (rows.length === 0) {
    return { synced: 0 };
  }

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'shop_id,external_id' });
  if (error) throw error;

  return { synced: rows.length };
}

module.exports = {
  fetchProducts,
  syncShopProducts,
  mapCategory,
  selectGarmentImage,
  scoreGarmentImageCandidate,
  mapProductToSyncRow,
};
