import { h, validateImageFile, fileToDataUrl, downloadImage, getPageProductInfo } from './utils.js';
import { createArSession } from './ar.js';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const POLL_INTERVAL = 3000;
const POLL_MAX_TRIES = 20; // ~60s

export function createWidget({ config, api, product, externalId }) {
  const page = getPageProductInfo();
  const productName = product.name || page.name;
  const productThumb = product.garment_image_url || page.image;

  let overlay = null;
  let modalBody = null;
  let arSession = null;
  let selectedSize = 'M';

  const fab = h('button', { class: 'ff-fab', type: 'button', 'aria-label': 'FashionFit', onclick: open }, config.buttonLabel);

  function mount() {
    document.body.appendChild(fab);
  }

  function open() {
    if (overlay) overlay.remove();
    modalBody = h('div', { class: 'ff-modal-body' });
    overlay = h('div', { class: 'ff-overlay', onclick: (e) => { if (e.target === overlay) close(); } },
      h('div', { class: 'ff-modal' },
        h('button', { class: 'ff-close', type: 'button', 'aria-label': 'Zamknij', onclick: close }, '×'),
        modalBody,
      ),
    );
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('ff-open'));
    renderModeScreen();
    api.trackEvent('widget_open', { productId: product.id });
  }

  function close() {
    api.trackEvent('close', { productId: product.id });
    stopAr();
    if (overlay) {
      const node = overlay;
      node.classList.remove('ff-open');
      setTimeout(() => node.remove(), 200);
      overlay = null;
    }
  }

  function stopAr() {
    if (arSession) {
      arSession.stop();
      arSession = null;
    }
  }

  function setBody(...nodes) {
    modalBody.innerHTML = '';
    nodes.forEach((n) => modalBody.appendChild(n));
  }

  function productHeader() {
    return h('div', { class: 'ff-product' },
      productThumb ? h('img', { src: productThumb, alt: productName }) : null,
      h('b', {}, productName),
    );
  }

  // -- Screen 1: choose mode ------------------------------------------------
  function renderModeScreen() {
    stopAr();
    const sizeRow = h('div', { class: 'ff-sizes' },
      ...SIZES.map((size) => {
        const btn = h('button', {
          class: `ff-size${size === selectedSize ? ' ff-active' : ''}`,
          type: 'button',
          onclick: () => {
            selectedSize = size;
            sizeRow.querySelectorAll('.ff-size').forEach((el) => el.classList.remove('ff-active'));
            btn.classList.add('ff-active');
          },
        }, size);
        return btn;
      }),
    );

    setBody(
      h('h2', { class: 'ff-h' }, 'Wirtualna przymierzalnia'),
      productHeader(),
      h('div', { class: 'ff-modes' },
        h('button', { class: 'ff-mode', type: 'button', onclick: renderPhotoScreen },
          h('span', { class: 'ff-emoji' }, '📸'),
          h('span', { class: 'ff-mode-label' }, 'Wgraj zdjęcie'),
        ),
        h('button', { class: 'ff-mode', type: 'button', onclick: renderArScreen },
          h('span', { class: 'ff-badge' }, 'Nowe'),
          h('span', { class: 'ff-emoji' }, '📹'),
          h('span', { class: 'ff-mode-label' }, 'Użyj kamerki'),
        ),
      ),
      h('div', { class: 'ff-sub' }, 'Wybierz rozmiar'),
      sizeRow,
      h('div', { class: 'ff-privacy' }, '🔒 Twoje zdjęcia nie są zapisywane'),
    );
  }

  // -- Screen 2A: photo AI --------------------------------------------------
  function renderPhotoScreen() {
    let dataUrl = null;
    const input = h('input', { type: 'file', accept: 'image/jpeg,image/png', style: { display: 'none' } });
    const errorBox = h('div', { class: 'ff-error', style: { display: 'none' } });
    const tryBtn = h('button', { class: 'ff-btn', type: 'button', disabled: 'true', onclick: () => runTryon() }, 'Przymierz');
    const previewWrap = h('div', {});
    const drop = h('div', { class: 'ff-drop' },
      h('span', { class: 'ff-emoji' }, '⬆️'),
      h('span', {}, 'Przeciągnij zdjęcie lub kliknij, aby wgrać'),
      h('span', { class: 'ff-sub' }, 'JPG lub PNG, maks. 10MB'),
    );

    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.style.display = msg ? 'block' : 'none';
    }

    async function handleFile(file) {
      const err = validateImageFile(file);
      if (err) { showError(err); return; }
      showError('');
      dataUrl = await fileToDataUrl(file);
      previewWrap.innerHTML = '';
      previewWrap.appendChild(h('img', { class: 'ff-preview', src: dataUrl, alt: 'Podgląd' }));
      tryBtn.removeAttribute('disabled');
    }

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('ff-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('ff-over'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('ff-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => { if (input.files[0]) handleFile(input.files[0]); });

    async function runTryon() {
      if (!dataUrl) return;
      api.trackEvent('tryon_start', { productId: product.id, metadata: { mode: 'photo', size: selectedSize } });
      renderLoading();
      try {
        const { sessionId } = await api.startPhotoTryon(product.id, dataUrl, { size: selectedSize });
        pollResult(sessionId);
      } catch (e) {
        renderPhotoError(e.message);
      }
    }

    setBody(
      h('h2', { class: 'ff-h' }, '📸 Wgraj swoje zdjęcie'),
      drop,
      input,
      previewWrap,
      errorBox,
      h('div', { class: 'ff-actions' },
        tryBtn,
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );
  }

  function renderLoading() {
    const bar = h('span', {});
    setBody(
      h('div', { class: 'ff-loading' },
        h('div', { class: 'ff-spinner' }),
        h('b', {}, 'Generuję dla Ciebie...'),
        h('div', { class: 'ff-sub' }, 'To potrwa około 10 sekund'),
        h('div', { class: 'ff-progress' }, bar),
      ),
    );
    // Animate towards 90% while we wait; the result handler completes it.
    let pct = 5;
    const timer = setInterval(() => {
      pct = Math.min(90, pct + 6);
      bar.style.width = `${pct}%`;
      if (!overlay) clearInterval(timer);
    }, 700);
    return () => { clearInterval(timer); bar.style.width = '100%'; };
  }

  function pollResult(sessionId) {
    let tries = 0;
    const finish = renderLoading();
    const timer = setInterval(async () => {
      tries += 1;
      if (!overlay) { clearInterval(timer); return; }
      try {
        const { status, resultImageUrl } = await api.getTryonStatus(sessionId);
        if (status === 'completed' && resultImageUrl) {
          clearInterval(timer);
          finish();
          renderResult(resultImageUrl);
        } else if (status === 'failed' || tries >= POLL_MAX_TRIES) {
          clearInterval(timer);
          renderPhotoError('Nie udało się wygenerować przymiarki. Spróbuj ponownie.');
        }
      } catch (e) {
        clearInterval(timer);
        renderPhotoError(e.message);
      }
    }, POLL_INTERVAL);
  }

  function renderPhotoError(msg) {
    setBody(
      h('h2', { class: 'ff-h' }, 'Coś poszło nie tak'),
      h('div', { class: 'ff-error' }, msg),
      h('div', { class: 'ff-actions' },
        h('button', { class: 'ff-btn', type: 'button', onclick: renderPhotoScreen }, 'Spróbuj ponownie'),
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );
  }

  function renderResult(resultUrl) {
    api.trackEvent('tryon_complete', { productId: product.id, metadata: { size: selectedSize } });
    setBody(
      h('div', { class: 'ff-result-head' },
        h('h2', { class: 'ff-h' }, 'Twoja przymiarka'),
        h('div', { class: 'ff-result-pills' },
          h('span', { class: 'ff-pill' }, `Rozmiar ${selectedSize}`),
          h('span', { class: 'ff-pill' }, 'HD'),
        ),
      ),
      h('div', { class: 'ff-result-stage' },
        h('img', { class: 'ff-result', src: resultUrl, alt: 'Wynik przymiarki' }),
      ),
      h('div', { class: 'ff-result-note' }, 'Wskazówka: najlepiej działa zdjęcie samego ubrania bez torebki i dodatków.'),
      h('div', { class: 'ff-actions' },
        h('button', { class: 'ff-btn', type: 'button', onclick: addToCart }, 'Dodaj do koszyka'),
        h('button', {
          class: 'ff-btn ff-btn-ghost',
          type: 'button',
          onclick: () => window.open(resultUrl, '_blank', 'noopener,noreferrer'),
        }, 'Otwórz pełny podgląd'),
        h('button', {
          class: 'ff-btn ff-btn-ghost',
          type: 'button',
          onclick: () => {
            api.trackEvent('download', { productId: product.id });
            downloadImage(resultUrl, 'fashionfit.jpg');
          },
        }, 'Pobierz zdjęcie'),
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, 'Przymierz inne'),
      ),
    );
  }

  // -- Screen 2B: live AR ---------------------------------------------------
  async function renderArScreen() {
    const video = h('video', { class: 'ff-video', playsinline: 'true', muted: 'true' });
    const canvas = h('canvas', { class: 'ff-canvas' });
    const slider = h('input', { class: 'ff-slider', type: 'range', min: '0.6', max: '1.6', step: '0.05', value: '1' });
    const status = h('div', { class: 'ff-sub' }, 'Uruchamiam kamerę...');

    slider.addEventListener('input', () => { if (arSession) arSession.setScale(parseFloat(slider.value)); });

    setBody(
      h('h2', { class: 'ff-h' }, '📹 Przymierzalnia na żywo'),
      status,
      video,
      canvas,
      h('label', { class: 'ff-sub' }, 'Dopasuj rozmiar'),
      slider,
      h('div', { class: 'ff-actions' },
        h('button', { class: 'ff-btn', type: 'button', onclick: capture }, '📸 Zrób zdjęcie'),
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );

    api.trackEvent('tryon_start', { productId: product.id, metadata: { mode: 'ar', size: selectedSize } });

    try {
      arSession = await createArSession({ video, canvas, garmentUrl: product.garment_image_url });
      status.textContent = 'Stań w kadrze całą sylwetką';
    } catch (e) {
      renderArFallback();
    }

    function capture() {
      if (!arSession) return;
      const shot = arSession.capture();
      stopAr();
      renderResult(shot);
    }
  }

  function renderArFallback() {
    stopAr();
    setBody(
      h('h2', { class: 'ff-h' }, 'Kamera niedostępna' ),
      h('div', { class: 'ff-sub' }, 'Nie udało się uzyskać dostępu do kamery. Skorzystaj z trybu zdjęcia.'),
      h('div', { class: 'ff-actions' },
        h('button', { class: 'ff-btn', type: 'button', onclick: renderPhotoScreen }, '📸 Użyj trybu zdjęcia'),
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );
  }

  // -- WooCommerce add-to-cart ---------------------------------------------
  async function addToCart() {
    api.trackEvent('add_to_cart', { productId: product.id, metadata: { size: selectedSize } });
    if (!externalId) {
      if (product.product_url) window.location = product.product_url;
      return;
    }
    try {
      const body = new FormData();
      body.append('product_id', externalId);
      body.append('quantity', '1');
      await fetch(`${location.origin}/?wc-ajax=add_to_cart`, { method: 'POST', body });
      document.body.dispatchEvent(new Event('wc_fragment_refresh'));
      close();
    } catch (e) {
      window.location = `${location.pathname}?add-to-cart=${externalId}`;
    }
  }

  return { mount, open, close };
}
