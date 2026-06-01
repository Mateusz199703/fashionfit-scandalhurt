import {
  h,
  validateImageFile,
  fileToDataUrl,
  analyzeImageDataUrl,
  downloadImage,
  getPageProductInfo,
} from './utils.js';
import { createArSession } from './ar.js';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const POLL_INTERVAL = 3000;
const POLL_MAX_TRIES = 20; // ~60s
const ADVISOR_MODULE_KEY = 'ai_stylist_advisor';
const TRYON_MODULE_KEY = 'virtual_try_on';
const ADVISOR_WELCOME_BUBBLE_MAX = 120;
const ADVISOR_DEFAULT_WELCOME_BUBBLE = 'Cześć, jestem Lume. Pomogę dobrać stylizację ✨';
const TRYON_CTA_TEXT_MAX = 40;
const DEFAULT_TRYON_CTA_TEXT = 'Przymierz wirtualnie';
const TRYON_CTA_MARKER = 'data-fashionfit-tryon-cta';
const ADVISOR_BUBBLE_KEY_PREFIX = 'fashionfit:advisor-bubble-dismissed:';
const ADVISOR_GREETING_MESSAGE = 'Cześć! 👋 Jestem Lume. Powiedz, na jaką okazję szukasz stylizacji?';

export function createWidget({ config, api, product, externalId }) {
  const page = getPageProductInfo();
  const productName = product.name || page.name;
  const productThumb = product.garment_image_url || page.image;
  const productHasContext = Boolean(product && product.id && !product._fallback);

  const launcherPosition = config.launcherPosition === 'bottom-left' || config.position === 'bottom-left'
    ? 'bottom-left'
    : 'bottom-right';
  const enableFloatingAdvisor = config.enableFloatingAdvisor !== false;
  const enableProductTryOnButton = config.enableProductTryOnButton !== false;
  const advisorWelcomeBubbleRaw = config.advisorWelcomeBubble;
  const advisorWelcomeBubble = (
    advisorWelcomeBubbleRaw === undefined || advisorWelcomeBubbleRaw === null
      ? ADVISOR_DEFAULT_WELCOME_BUBBLE
      : String(advisorWelcomeBubbleRaw || '')
  ).slice(0, ADVISOR_WELCOME_BUBBLE_MAX).trim();
  const productTryOnButtonText = (String(config.productTryOnButtonText || DEFAULT_TRYON_CTA_TEXT).trim().slice(0, TRYON_CTA_TEXT_MAX)
    || DEFAULT_TRYON_CTA_TEXT);

  let overlay = null;
  let modalCard = null;
  let modalBody = null;
  let arSession = null;
  let selectedSize = 'M';
  let advisorConversationId = null;
  let advisorMessages = [];
  let advisorDraft = '';
  let advisorPending = false;
  let advisorError = '';
  let advisorLastAttemptMessage = '';
  let advisorModuleChecked = false;
  let advisorModuleEnabled = false;
  let advisorLockedPayload = null;
  let advisorModuleCheckError = '';
  let advisorChecking = false;
  let tryOnModuleEnabled = false;
  let moduleAccessResolved = false;
  let moduleAccessError = '';
  let launchersMounted = false;
  let tryOnObserver = null;
  let tryOnObserverRaf = null;

  let advisorLauncher = null;
  let advisorBubble = null;
  let productTryOnButton = null;

  function mount() {
    if (launchersMounted) return;
    launchersMounted = true;
    resolveModuleAccessAndMount().catch(() => {});
  }

  function open(entry = 'default') {
    removeLaunchers();
    if (overlay) overlay.remove();
    advisorConversationId = null;
    advisorMessages = [];
    advisorDraft = '';
    advisorPending = false;
    advisorError = '';
    advisorLastAttemptMessage = '';
    advisorModuleChecked = false;
    advisorModuleEnabled = false;
    advisorLockedPayload = null;
    advisorModuleCheckError = '';
    advisorChecking = false;
    modalBody = h('div', { class: 'ff-modal-body' });
    modalCard = h('div', { class: 'ff-modal' },
        h('button', { class: 'ff-close', type: 'button', 'aria-label': 'Zamknij', onclick: close }, '×'),
        modalBody,
      );
    overlay = h('div', { class: 'ff-overlay', onclick: (e) => { if (e.target === overlay) close(); } },
      modalCard,
    );
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('ff-open'));
    if (entry === 'advisor') renderAdvisorScreen();
    else if (entry === 'tryon') renderPhotoScreen();
    else renderModeScreen();
    api.trackEvent('widget_open', { productId: product.id, metadata: { entryPoint: entry } });
  }

  function close() {
    api.trackEvent('close', { productId: product.id });
    stopAr();
    if (overlay) {
      const node = overlay;
      node.classList.remove('ff-open');
      setTimeout(() => {
        node.remove();
        if (moduleAccessResolved && !moduleAccessError) {
          mountAdvisorLauncher();
          ensureProductTryOnButton();
          startTryOnObserver();
        }
      }, 200);
      overlay = null;
      modalCard = null;
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
    nodes.forEach((n) => {
      if (n instanceof Node) modalBody.appendChild(n);
    });
  }

  function setModalVariant(mode = 'default') {
    if (!overlay || !modalCard) return;
    const isAdvisor = mode === 'advisor';
    overlay.classList.toggle('ff-overlay-advisor', isAdvisor);
    modalCard.classList.toggle('ff-modal-advisor', isAdvisor);
  }

  function detectModuleEnabled(snapshot, moduleKey) {
    const modules = Array.isArray(snapshot && snapshot.modules) ? snapshot.modules : [];
    const found = modules.find((item) => item && item.key === moduleKey);
    return Boolean(found && found.enabled);
  }

  function getAdvisorBubbleStorageKey() {
    const shopId = String(config.shopId || 'unknown-shop');
    return `${ADVISOR_BUBBLE_KEY_PREFIX}${shopId}`;
  }

  function isAdvisorBubbleDismissed() {
    try {
      return sessionStorage.getItem(getAdvisorBubbleStorageKey()) === '1';
    } catch {
      return false;
    }
  }

  function dismissAdvisorBubble() {
    try {
      sessionStorage.setItem(getAdvisorBubbleStorageKey(), '1');
    } catch {
      // ignore storage failures in storefront context
    }
    if (advisorBubble) {
      advisorBubble.remove();
      advisorBubble = null;
    }
  }

  function removeLaunchers() {
    if (advisorLauncher) {
      advisorLauncher.remove();
      advisorLauncher = null;
    }
    if (advisorBubble) {
      advisorBubble.remove();
      advisorBubble = null;
    }
    if (productTryOnButton) {
      productTryOnButton.remove();
      productTryOnButton = null;
    }
    if (tryOnObserver) {
      tryOnObserver.disconnect();
      tryOnObserver = null;
    }
  }

  function resolveTryOnAnchor() {
    try {
      const addToCartButton = document.querySelector(
        'form.cart .single_add_to_cart_button, .summary .single_add_to_cart_button, button.single_add_to_cart_button',
      );
      if (addToCartButton) {
        return addToCartButton.closest('form.cart') || addToCartButton;
      }
      return document.querySelector('form.cart, .summary form.cart');
    } catch {
      return null;
    }
  }

  function ensureProductTryOnButton() {
    if (!enableProductTryOnButton || !tryOnModuleEnabled || !productHasContext) {
      if (productTryOnButton) {
        productTryOnButton.remove();
        productTryOnButton = null;
      }
      return;
    }

    const anchor = resolveTryOnAnchor();
    if (!anchor || !anchor.parentNode) return;

    if (!productTryOnButton) {
      const existing = document.querySelector(`[${TRYON_CTA_MARKER}="1"]`);
      if (existing instanceof HTMLButtonElement) {
        productTryOnButton = existing;
      }
    }

    if (!productTryOnButton) {
      productTryOnButton = h('button', {
        class: 'ff-product-tryon-cta',
        type: 'button',
        onclick: () => open('tryon'),
      }, productTryOnButtonText);
      productTryOnButton.setAttribute(TRYON_CTA_MARKER, '1');
    }

    productTryOnButton.className = 'ff-product-tryon-cta';
    productTryOnButton.type = 'button';
    productTryOnButton.onclick = () => open('tryon');
    productTryOnButton.setAttribute(TRYON_CTA_MARKER, '1');
    productTryOnButton.textContent = productTryOnButtonText;
    if (!productTryOnButton.parentNode || productTryOnButton.parentNode !== anchor.parentNode) {
      anchor.insertAdjacentElement('afterend', productTryOnButton);
    } else {
      const sibling = anchor.nextElementSibling;
      if (sibling !== productTryOnButton) {
        anchor.insertAdjacentElement('afterend', productTryOnButton);
      }
    }
  }

  function startTryOnObserver() {
    if (tryOnObserver || !enableProductTryOnButton || !tryOnModuleEnabled) return;
    tryOnObserver = new MutationObserver(() => {
      if (tryOnObserverRaf) cancelAnimationFrame(tryOnObserverRaf);
      tryOnObserverRaf = requestAnimationFrame(() => ensureProductTryOnButton());
    });
    tryOnObserver.observe(document.body, { childList: true, subtree: true });
  }

  function mountAdvisorLauncher() {
    if (!enableFloatingAdvisor || !advisorModuleEnabled) return;
    if (!advisorLauncher) {
      advisorLauncher = h('button', {
        class: `ff-advisor-fab ff-pos-${launcherPosition}`,
        type: 'button',
        'aria-label': 'Otwórz Lume · stylistę AI',
        onclick: () => open('advisor'),
      },
      h('span', { class: 'ff-advisor-fab-core', 'aria-hidden': 'true' }),
      h('span', { class: 'ff-advisor-fab-label' }, 'Zapytaj Lume'),
      );
      document.body.appendChild(advisorLauncher);
    }

    if (!advisorWelcomeBubble || isAdvisorBubbleDismissed() || advisorBubble) return;

    const bubbleClose = h('button', {
      class: 'ff-advisor-bubble-close',
      type: 'button',
      'aria-label': 'Zamknij wiadomość',
      onclick: (e) => {
        e.stopPropagation();
        dismissAdvisorBubble();
      },
    }, '×');

    advisorBubble = h('button', {
      class: `ff-advisor-bubble ff-pos-${launcherPosition}`,
      type: 'button',
      onclick: () => {
        dismissAdvisorBubble();
        open('advisor');
      },
    },
    h('span', { class: 'ff-advisor-bubble-text' }, advisorWelcomeBubble),
    bubbleClose,
    );
    document.body.appendChild(advisorBubble);
  }

  async function resolveModuleAccessAndMount() {
    removeLaunchers();
    moduleAccessResolved = false;
    moduleAccessError = '';
    advisorModuleEnabled = false;
    tryOnModuleEnabled = false;
    try {
      const snapshot = await api.getModules();
      advisorModuleEnabled = detectModuleEnabled(snapshot, ADVISOR_MODULE_KEY);
      tryOnModuleEnabled = detectModuleEnabled(snapshot, TRYON_MODULE_KEY);
    } catch (err) {
      moduleAccessError = err && err.message ? err.message : 'Nie udało się sprawdzić modułów.';
    } finally {
      moduleAccessResolved = true;
    }

    if (!moduleAccessResolved || moduleAccessError) return;

    mountAdvisorLauncher();
    ensureProductTryOnButton();
    startTryOnObserver();
  }

  function productHeader() {
    return h('div', { class: 'ff-product' },
      productThumb ? h('img', { src: productThumb, alt: productName }) : null,
      h('b', {}, productName),
    );
  }

  // -- Screen 1: choose mode ------------------------------------------------
  function renderModeScreen() {
    setModalVariant('default');
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
      h('div', { class: 'ff-sub' }, 'Try-On i Lume w jednym miejscu'),
      productHeader(),
      h('div', { class: 'ff-modes' },
        h('button', { class: 'ff-mode', type: 'button', onclick: renderPhotoScreen },
          h('span', { class: 'ff-emoji' }, '↗'),
          h('span', { class: 'ff-mode-label' }, 'Wgraj zdjęcie'),
        ),
        h('button', { class: 'ff-mode', type: 'button', onclick: renderArScreen },
          h('span', { class: 'ff-badge' }, 'Nowe'),
          h('span', { class: 'ff-emoji' }, '◉'),
          h('span', { class: 'ff-mode-label' }, 'Użyj kamerki'),
        ),
        h('button', { class: 'ff-mode', type: 'button', onclick: renderAdvisorScreen },
          h('span', { class: 'ff-emoji' }, '✦'),
          h('span', { class: 'ff-mode-label' }, 'Lume · stylista AI'),
        ),
      ),
      h('div', { class: 'ff-sub' }, 'Wybierz rozmiar'),
      sizeRow,
      h('div', { class: 'ff-privacy' }, '🔒 Twoje zdjęcia nie są zapisywane'),
    );
  }

  function getSafeProductUrl(value) {
    if (!value) return null;
    try {
      const parsed = new URL(String(value));
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  }

  async function checkAdvisorModuleAccess() {
    if (advisorChecking) return;
    advisorChecking = true;
    advisorModuleCheckError = '';
    advisorLockedPayload = null;
    try {
      const snapshot = await api.getModules();
      advisorModuleChecked = true;
      advisorModuleEnabled = detectModuleEnabled(snapshot, ADVISOR_MODULE_KEY);
      if (!advisorModuleEnabled) {
        advisorLockedPayload = {
          code: 'MODULE_LOCKED',
          message: 'Advisor module is locked for this shop',
          upgrade: {
            requiredModule: 'ai_stylist_advisor',
            action: 'upgrade_plan',
          },
        };
      }
    } catch (err) {
      advisorModuleCheckError = err && err.message ? err.message : 'Nie udało się sprawdzić dostępności modułu.';
    } finally {
      advisorChecking = false;
      if (overlay) renderAdvisorScreen();
    }
  }

  function renderAdvisorRecommendations(recommendations) {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return null;
    }

    return h('div', { class: 'ff-advisor-cards' },
      ...recommendations.slice(0, 3).map((item) => {
        const safeProductUrl = getSafeProductUrl(item && item.productUrl);
        const productCode = item && (item.externalId || item.productId) ? String(item.externalId || item.productId) : '';
        return h('div', { class: 'ff-advisor-card' },
          item && item.garmentImageUrl
          ? h('img', { class: 'ff-advisor-card-image', src: item.garmentImageUrl, alt: item.name || 'Produkt' })
          : null,
          h('div', { class: 'ff-advisor-card-body' },
            h('b', { class: 'ff-advisor-card-name' }, item && item.name ? item.name : 'Produkt'),
            item && item.category ? h('div', { class: 'ff-advisor-card-category' }, item.category) : null,
            productCode ? h('div', { class: 'ff-advisor-card-code' }, `ID: ${productCode}`) : null,
            safeProductUrl
              ? h('button', {
                class: 'ff-btn ff-btn-ghost ff-advisor-card-cta',
                type: 'button',
                onclick: () => window.open(safeProductUrl, '_blank', 'noopener,noreferrer'),
              }, 'Zobacz produkt')
              : null,
          ),
        );
      }),
    );
  }

  function normalizeResponseType(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    return key;
  }

  function shouldShowAdvisorNoMatchNote(responseType, recommendations) {
    if (Array.isArray(recommendations) && recommendations.length > 0) return false;
    return normalizeResponseType(responseType) === 'no_match';
  }

  function shouldRenderAdvisorCards(responseType, recommendations) {
    if (!Array.isArray(recommendations) || recommendations.length === 0) return false;
    const key = normalizeResponseType(responseType);
    if (!key) return true;
    return ['browse_catalog', 'recommend_products', 'product_search', 'product_explanation'].includes(key);
  }

  function renderAdvisorNoMatchNote(showNoMatch) {
    if (!showNoMatch) return null;
    return h('div', { class: 'ff-advisor-empty' }, 'Brak dopasowanych produktów dla tej wiadomości.');
  }

  function renderAdvisorRecommendationsWithState(recommendations, responseType) {
    const cards = shouldRenderAdvisorCards(responseType, recommendations)
      ? renderAdvisorRecommendations(recommendations)
      : null;
    if (cards) return cards;
    const showNoMatch = shouldShowAdvisorNoMatchNote(responseType, recommendations);
    return renderAdvisorNoMatchNote(showNoMatch);
  }

  function renderAdvisorScreen() {
    setModalVariant('advisor');
    stopAr();

    const advisorHeader = h('div', { class: 'ff-advisor-header' },
      h('div', { class: 'ff-advisor-header-profile' },
        h('span', { class: 'ff-advisor-core', 'aria-hidden': 'true' }),
        h('div', { class: 'ff-advisor-header-copy' },
          h('b', {}, 'Lume · stylista AI'),
          h('span', {},
            h('i', { class: 'ff-advisor-status-dot', 'aria-hidden': 'true' }),
            'Online · odpowiada od razu',
          ),
        ),
      ),
    );

    if (!advisorModuleChecked && !advisorModuleCheckError && !advisorLockedPayload) {
      setBody(
        advisorHeader,
        h('div', { class: 'ff-advisor-loading' },
          h('div', { class: 'ff-spinner' }),
          h('div', { class: 'ff-sub' }, 'Sprawdzam dostępność modułu...'),
        ),
        h('div', { class: 'ff-actions' },
          h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
        ),
      );
      checkAdvisorModuleAccess();
      return;
    }

    if (advisorModuleCheckError) {
      setBody(
        advisorHeader,
        h('div', { class: 'ff-error' }, advisorModuleCheckError),
        h('div', { class: 'ff-actions' },
          h('button', {
            class: 'ff-btn',
            type: 'button',
            onclick: () => {
              advisorModuleCheckError = '';
              advisorModuleChecked = false;
              advisorLockedPayload = null;
              renderAdvisorScreen();
            },
          }, 'Spróbuj ponownie'),
          h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
        ),
      );
      return;
    }

    if (!advisorModuleEnabled || advisorLockedPayload) {
      const lockedMessage = (advisorLockedPayload && (advisorLockedPayload.message || advisorLockedPayload.error))
        || 'Advisor module is locked for this shop';
      setBody(
        advisorHeader,
        h('div', { class: 'ff-advisor-locked' },
          h('b', {}, 'Moduł niedostępny'),
          h('div', {}, lockedMessage),
          h('div', { class: 'ff-sub' }, 'Aby odblokować ten moduł, przejdź na wyższy plan.'),
        ),
        h('div', { class: 'ff-actions' },
          h('button', {
            class: 'ff-btn',
            type: 'button',
            onclick: () => {
              advisorModuleChecked = false;
              advisorModuleEnabled = false;
              advisorLockedPayload = null;
              advisorModuleCheckError = '';
              renderAdvisorScreen();
            },
          }, 'Sprawdź ponownie'),
          h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
        ),
      );
      return;
    }

    async function sendAdvisorMessage(messageText, options = {}) {
      const { retry = false } = options;
      if (advisorPending) return;
      const message = String(messageText || '').trim();
      if (!message) return;

      advisorPending = true;
      advisorError = '';
      advisorLastAttemptMessage = message;
      if (!retry) {
        advisorMessages = advisorMessages.concat([{ role: 'user', text: message }]);
        advisorDraft = '';
      }
      renderAdvisorScreen();

      try {
        const response = await api.advisorChat(message, advisorConversationId);
        if (response && response.conversationId) {
          advisorConversationId = response.conversationId;
        }
        const recommendations = Array.isArray(response && response.recommendations) ? response.recommendations.slice(0, 3) : [];
        const responseType = response && response.meta ? response.meta.responseType : null;
        advisorMessages = advisorMessages.concat([{
          role: 'assistant',
          text: response && response.reply ? response.reply : 'Oto rekomendacje z Twojego katalogu.',
          recommendations,
          responseType: normalizeResponseType(responseType),
        }]);
      } catch (err) {
        if (err && err.code === 'MODULE_LOCKED') {
          advisorLockedPayload = err.payload || {
            code: 'MODULE_LOCKED',
            message: err.message || 'Advisor module is locked for this shop',
          };
          advisorModuleEnabled = false;
        } else {
          advisorError = err && err.message ? err.message : 'Nie udało się wysłać wiadomości.';
        }
      } finally {
        advisorPending = false;
        if (overlay) renderAdvisorScreen();
      }
    }

    function buildAssistantRow(text, recommendations = [], responseType = null, bubbleClass = '') {
      return h('div', { class: 'ff-chat-row ff-chat-assistant' },
        h('span', { class: 'ff-chat-avatar', 'aria-hidden': 'true' },
          h('span', { class: 'ff-chat-avatar-core', 'aria-hidden': 'true' }),
        ),
        h('div', { class: 'ff-chat-stack' },
          h('div', { class: `ff-chat-bubble${bubbleClass ? ` ${bubbleClass}` : ''}` }, text || ''),
          renderAdvisorRecommendationsWithState(recommendations || [], responseType),
        ),
      );
    }

    function buildUserRow(text) {
      return h('div', { class: 'ff-chat-row ff-chat-user' },
        h('div', { class: 'ff-chat-bubble' }, text || ''),
      );
    }

    const chatRows = advisorMessages.length > 0
      ? advisorMessages.map((msg) => (msg.role === 'assistant'
        ? buildAssistantRow(msg.text || '', msg.recommendations || [], msg.responseType)
        : buildUserRow(msg.text || '')))
      : [buildAssistantRow(ADVISOR_GREETING_MESSAGE)];

    if (advisorPending) {
      chatRows.push(
        buildAssistantRow('Przygotowuję propozycje...', [], null, 'ff-chat-bubble-loading'),
      );
    }

    const input = h('textarea', {
      class: 'ff-advisor-input',
      rows: '3',
      maxlength: '1000',
      placeholder: 'Napisz wiadomość...',
      value: advisorDraft,
      oninput: (e) => {
        advisorDraft = e.target.value || '';
        updateSendButtonState();
        if (advisorError) advisorError = '';
      },
      onkeydown: (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendAdvisorMessage(advisorDraft);
        }
      },
    });
    const sendButton = h('button', {
      class: `ff-btn ff-advisor-send${advisorPending ? ' is-loading' : ''}`,
      type: 'button',
      onclick: () => sendAdvisorMessage(advisorDraft),
      'aria-label': advisorPending ? 'Wysyłanie wiadomości' : 'Wyślij wiadomość',
    }, advisorPending ? '…' : '➤');

    const micButton = h('button', {
      class: 'ff-btn ff-btn-ghost ff-advisor-mic',
      type: 'button',
      disabled: 'true',
      'aria-disabled': 'true',
      'aria-label': 'Mikrofon (wkrótce)',
    }, '🎤');

    function updateSendButtonState() {
      if (advisorPending || !advisorDraft.trim()) {
        sendButton.setAttribute('disabled', 'true');
      } else {
        sendButton.removeAttribute('disabled');
      }
    }

    if (advisorPending) input.setAttribute('disabled', 'true');
    updateSendButtonState();

    const chatList = h(
      'div',
      { class: 'ff-chat-list' },
      h('div', { class: 'ff-chat-day' }, 'Dzisiaj'),
      ...chatRows,
    );

    setBody(
      advisorHeader,
      chatList,
      advisorError
        ? h('div', { class: 'ff-error ff-advisor-inline-error' },
          advisorError,
          advisorLastAttemptMessage
            ? h('button', {
              class: 'ff-btn ff-btn-ghost ff-advisor-retry',
              type: 'button',
              onclick: () => sendAdvisorMessage(advisorLastAttemptMessage, { retry: true }),
              disabled: advisorPending ? 'true' : null,
            }, 'Spróbuj ponownie')
            : null,
        )
        : null,
      h('div', { class: 'ff-advisor-composer' },
        h('div', { class: 'ff-advisor-input-wrap' }, input),
        micButton,
        sendButton,
      ),
      h('div', { class: 'ff-advisor-foot' }, 'Napędzane przez FashionFit AI · zgodne z RODO'),
      h('div', { class: 'ff-actions ff-advisor-nav' },
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );

    requestAnimationFrame(() => {
      chatList.scrollTop = chatList.scrollHeight;
      if (!overlay || advisorPending) return;
      if (document.activeElement !== input) input.focus();
    });
  }

  // -- Screen 2A: photo AI --------------------------------------------------
  function renderPhotoScreen() {
    setModalVariant('default');
    let dataUrl = null;
    let imageMeta = null;
    const input = h('input', { type: 'file', accept: 'image/jpeg,image/png', style: { display: 'none' } });
    const errorBox = h('div', { class: 'ff-error', style: { display: 'none' } });
    const tryBtn = h('button', { class: 'ff-btn', type: 'button', disabled: 'true', onclick: () => runTryon() }, 'Przymierz');
    const drop = h('div', { class: 'ff-drop' },
      h('span', { class: 'ff-emoji' }, '⬆️'),
      h('span', {}, 'Przeciągnij zdjęcie lub kliknij, aby wgrać'),
      h('span', { class: 'ff-sub' }, 'JPG lub PNG, maks. 10MB'),
    );
    const uploadWrap = h('div', { class: 'ff-upload-wrap' }, drop);
    const previewImage = h('img', { class: 'ff-preview', alt: 'Podgląd zdjęcia' });
    const previewMeta = h('div', { class: 'ff-upload-meta' });
    const changeBtn = h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: () => input.click() }, 'Zmień zdjęcie');
    const previewCard = h(
      'div',
      { class: 'ff-upload-card', style: { display: 'none' } },
      previewImage,
      previewMeta,
      changeBtn,
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
      try {
        imageMeta = await analyzeImageDataUrl(dataUrl);
      } catch {
        imageMeta = { output_quality: 'max' };
      }
      previewImage.src = dataUrl;
      previewMeta.textContent = imageMeta && imageMeta.image_width && imageMeta.image_height
        ? `Rozdzielczość: ${imageMeta.image_width}×${imageMeta.image_height} · ${imageMeta.image_megapixels} MP · jakość wejściowa: ${imageMeta.image_quality_bucket}`
        : 'Jakość wejściowa: automatycznie wykryta';
      drop.style.display = 'none';
      previewCard.style.display = 'block';
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
      const metadata = {
        mode: 'photo',
        size: selectedSize,
        output_quality: 'max',
        ...(imageMeta || {}),
      };
      api.trackEvent('tryon_start', { productId: product.id, metadata });
      renderLoading();
      try {
        const { sessionId } = await api.startPhotoTryon(product.id, dataUrl, metadata);
        pollResult(sessionId);
      } catch (e) {
        renderPhotoError(e.message);
      }
    }

    setBody(
      h('h2', { class: 'ff-h' }, '📸 Wgraj swoje zdjęcie'),
      uploadWrap,
      previewCard,
      input,
      errorBox,
      h('div', { class: 'ff-actions' },
        tryBtn,
        h('button', { class: 'ff-btn ff-btn-ghost', type: 'button', onclick: renderModeScreen }, '← Wróć'),
      ),
    );
  }

  function renderLoading() {
    const bar = h('span', {});
    const steps = [
      h('div', { class: 'ff-step ff-step-active' }, '1. Analiza zdjęcia'),
      h('div', { class: 'ff-step' }, '2. Dopasowanie produktu'),
      h('div', { class: 'ff-step' }, '3. Render HD'),
      h('div', { class: 'ff-step' }, '4. Finalizacja'),
    ];
    const stepsWrap = h('div', { class: 'ff-steps' }, steps);
    setBody(
      h('div', { class: 'ff-loading' },
        h('div', { class: 'ff-spinner' }),
        h('b', {}, 'Generuję dla Ciebie...'),
        h('div', { class: 'ff-sub' }, 'Zachowujemy najwyższą jakość finalnego zdjęcia'),
        stepsWrap,
        h('div', { class: 'ff-progress' }, bar),
      ),
    );
    // Animate towards 90% while we wait; the result handler completes it.
    let pct = 5;
    let activeStep = 0;
    const timer = setInterval(() => {
      pct = Math.min(90, pct + 6);
      bar.style.width = `${pct}%`;
      if (pct >= 25 && activeStep < 1) activeStep = 1;
      if (pct >= 55 && activeStep < 2) activeStep = 2;
      if (pct >= 80 && activeStep < 3) activeStep = 3;
      steps.forEach((el, idx) => {
        el.classList.remove('ff-step-done', 'ff-step-active');
        if (idx < activeStep) el.classList.add('ff-step-done');
        if (idx === activeStep) el.classList.add('ff-step-active');
      });
      if (!overlay) clearInterval(timer);
    }, 700);
    return () => {
      clearInterval(timer);
      bar.style.width = '100%';
      steps.forEach((el) => {
        el.classList.remove('ff-step-active');
        el.classList.add('ff-step-done');
      });
    };
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
    api.trackEvent('tryon_complete', { productId: product.id, metadata: { size: selectedSize, output_quality: 'max' } });
    setBody(
      h('div', { class: 'ff-result-head' },
        h('h2', { class: 'ff-h' }, 'Twoja przymiarka'),
        h('div', { class: 'ff-result-pills' },
          h('span', { class: 'ff-pill' }, `Rozmiar ${selectedSize}`),
          h('span', { class: 'ff-pill' }, 'MAX QUALITY'),
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
    setModalVariant('default');
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
