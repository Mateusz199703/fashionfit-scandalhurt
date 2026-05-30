const fetch = require('node-fetch');
const { supabase } = require('./supabase');

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

  const rows = products.map((p) => ({
    shop_id: shop.id,
    external_id: String(p.id),
    name: p.name || null,
    category: mapCategory(p.categories),
    garment_image_url: selectGarmentImage(p.images),
    product_url: p.permalink || null,
    variants: Array.isArray(p.variations) && p.variations.length ? { variation_ids: p.variations } : null,
    is_synced: true,
    last_synced_at: new Date().toISOString(),
  }));

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
};
