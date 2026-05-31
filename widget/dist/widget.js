(()=>{function t(n,a={},...s){let e=document.createElement(n);for(let[i,f]of Object.entries(a||{}))f!=null&&(i==="class"?e.className=f:i==="html"?e.innerHTML=f:i==="style"&&typeof f=="object"?Object.assign(e.style,f):i.startsWith("on")&&typeof f=="function"?e.addEventListener(i.slice(2).toLowerCase(),f):e.setAttribute(i,f));for(let i of s.flat())i==null||i===!1||e.appendChild(typeof i=="string"?document.createTextNode(i):i);return e}function V(n){let a=window.FashionFitConfig||{},s=n||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),e=s&&s.dataset||{};return{apiKey:a.apiKey||e.fashionfitKey||null,shopId:a.shopId||e.fashionfitShop||null,apiUrl:(a.apiUrl||e.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:a.primaryColor||e.fashionfitColor||"#C4883A",buttonLabel:a.buttonLabel||e.fashionfitLabel||"Przymierz wirtualnie \u2728",tryonProvider:a.tryonProvider||e.fashionfitProvider||"auto"}}function Q(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function tt(){let n=document.body.className.match(/postid-(\d+)/);if(n)return n[1];let a=document.querySelector('[id^="product-"]');if(a&&a.id){let i=a.id.match(/^product-(\d+)$/);if(i)return i[1]}let s=document.querySelector('meta[property="product:retailer_item_id"]');if(s&&s.getAttribute("content"))return s.getAttribute("content");let e=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return e?e.getAttribute("data-product_id")||e.getAttribute("value"):null}var wt=["image/jpeg","image/png"],kt=10*1024*1024;function et(n){return n?wt.includes(n.type)?n.size>kt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function at(n){return new Promise((a,s)=>{let e=new FileReader;e.onload=()=>a(e.result),e.onerror=()=>s(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),e.readAsDataURL(n)})}function ot(n){return new Promise((a,s)=>{let e=new Image;e.onload=()=>{let i=Number(e.naturalWidth||e.width||0),f=Number(e.naturalHeight||e.height||0),p=i>0&&f>0?Number((i*f/1e6).toFixed(2)):0,l="unknown";p>=4.5?l="ultra":p>=2?l="high":p>=.9?l="medium":p>0&&(l="low"),a({image_width:i,image_height:f,image_megapixels:p,image_quality_bucket:l,output_quality:"max"})},e.onerror=()=>s(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 rozdzielczo\u015Bci zdj\u0119cia")),e.src=n})}async function rt(n,a){try{let e=await(await fetch(n)).blob(),i=URL.createObjectURL(e),f=t("a",{href:i,download:a});document.body.appendChild(f),f.click(),f.remove(),URL.revokeObjectURL(i)}catch{window.open(n,"_blank")}}function W(){let n=document.querySelector(".product_title, h1.entry-title, h1"),a=document.querySelector('meta[property="og:title"]'),s=document.querySelector('meta[property="og:image"]'),e=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:n&&n.textContent.trim()||a&&a.content||"Produkt",image:e&&(e.currentSrc||e.src)||s&&s.content||null}}var zt=`
.ff-overlay, .ff-overlay * {
  box-sizing: border-box !important;
}
.ff-overlay button,
.ff-overlay input,
.ff-overlay select,
.ff-overlay textarea,
.ff-overlay span,
.ff-overlay b,
.ff-overlay div,
.ff-overlay h2,
.ff-overlay label {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  letter-spacing: normal !important;
}

.ff-fab {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 99999 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 13px 22px !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 999px !important;
  cursor: pointer !important;
  background: linear-gradient(120deg, #7b61ff 0%, #4f46e5 100%) !important;
  color: #fff !important;
  font: 700 14px/1 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  box-shadow:
    0 16px 36px rgba(46, 36, 146, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  letter-spacing: 0.01em !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: ff-slide-up 0.35s ease both;
}
.ff-fab:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 44px rgba(46, 36, 146, 0.56),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.ff-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background:
    radial-gradient(circle at 20% 0%, rgba(123, 97, 255, 0.22), transparent 45%),
    radial-gradient(circle at 90% 100%, rgba(79, 70, 229, 0.18), transparent 48%),
    rgba(8, 8, 12, 0.76);
  backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 0.22s ease;
  font: 400 15px/1.5 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.ff-overlay.ff-open {
  opacity: 1;
}

.ff-modal {
  position: relative;
  width: min(700px, 96vw);
  max-height: calc(100dvh - 28px);
  overflow-y: auto;
  background:
    radial-gradient(38rem 17rem at 100% -8%, rgba(123, 97, 255, 0.16), transparent 62%),
    linear-gradient(160deg, rgba(19, 19, 26, 0.96) 0%, rgba(9, 9, 14, 0.96) 100%);
  color: #f7f8ff;
  border-radius: 28px;
  padding: 28px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 34px 90px rgba(0, 0, 0, 0.62),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  transform: translateY(12px);
  transition: transform 0.25s ease;
}
.ff-modal::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 28px;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.08) 0%, transparent 34%),
    radial-gradient(30rem 14rem at -10% 0%, rgba(123, 97, 255, 0.14), transparent 72%);
}
.ff-overlay.ff-open .ff-modal {
  transform: translateY(0);
  animation: ff-fade-in 0.25s ease both;
}

.ff-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  font-size: 30px !important;
  font-weight: 300 !important;
  line-height: 0.7 !important;
  color: rgba(255, 255, 255, 0.78);
  transition: background 0.2s ease, color 0.2s ease;
}
.ff-close:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.ff-h {
  margin: 0 0 16px;
  padding-right: 56px;
  font-family: "Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
  color: #ffffff !important;
  font-size: clamp(34px, 4.8vw, 42px) !important;
  font-weight: 700 !important;
  letter-spacing: -0.03em !important;
  line-height: 1.02 !important;
}
.ff-sub {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.ff-product {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.ff-product img {
  width: 78px !important;
  height: 78px !important;
  object-fit: cover;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.ff-product b {
  font-size: 18px !important;
  line-height: 1.3 !important;
  color: #f8f9ff !important;
  font-weight: 700 !important;
}

.ff-modes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.ff-mode {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 134px;
  padding: 16px 12px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  cursor: pointer;
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.04) 100%) !important;
  color: #f9f9ff !important;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.ff-mode:hover {
  transform: translateY(-2px);
  border-color: rgba(123, 97, 255, 0.85) !important;
  box-shadow:
    0 14px 30px -20px rgba(123, 97, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
.ff-mode .ff-emoji {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  font-size: 24px !important;
  width: 48px !important;
  height: 48px !important;
  border-radius: 999px !important;
  background: linear-gradient(130deg, #7b61ff, #4f46e5) !important;
  color: #fff !important;
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.48) !important;
}
.ff-mode .ff-mode-label {
  display: block !important;
  font-family: "Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 15px !important;
  line-height: 1.2 !important;
  font-weight: 700 !important;
  color: #f4f5ff !important;
  text-transform: none !important;
}
.ff-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 177, 92, 0.18);
  border: 1px solid rgba(255, 177, 92, 0.5);
  color: #ffe1bd;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  z-index: 2;
}

.ff-sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 6px 0 20px;
}
.ff-size {
  min-width: 62px;
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s ease;
}
.ff-size.ff-active {
  border-color: rgba(123, 97, 255, 0.9);
  background: linear-gradient(120deg, #7b61ff, #4f46e5);
  color: #fff;
  box-shadow: 0 10px 24px -16px rgba(123, 97, 255, 1);
}

.ff-privacy {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
}

.ff-upload-wrap {
  border-radius: 16px;
}
.ff-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 34px 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.74);
  text-align: center;
  transition: border-color 0.18s ease, background 0.18s ease;
  background: rgba(255, 255, 255, 0.03);
}
.ff-drop.ff-over {
  border-color: var(--ff-primary);
  background: rgba(123, 97, 255, 0.1);
}

.ff-upload-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  margin-top: 6px;
}
.ff-preview {
  width: 100%;
  border-radius: 14px;
  margin: 8px 0;
  display: block;
}
.ff-upload-meta {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.45;
  margin: 2px 0 10px;
}

.ff-result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ff-result-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.ff-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.ff-result-stage {
  margin-top: 8px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}
.ff-result {
  width: 100%;
  max-height: 64vh;
  object-fit: contain;
  display: block;
  background: rgba(255, 255, 255, 0.06);
}
.ff-result-note {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 10px 12px;
}

.ff-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 18px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  background: linear-gradient(120deg, #7b61ff 0%, #4f46e5 100%);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
  box-shadow: 0 16px 28px -20px rgba(79, 70, 229, 0.9);
  transition: transform 0.18s ease, filter 0.18s ease;
}
.ff-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}
.ff-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: none;
}
.ff-btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.ff-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.ff-loading {
  text-align: center;
  padding: 18px 0;
}
.ff-steps {
  margin: 10px auto 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  text-align: left;
}
.ff-step {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  padding: 7px 9px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.04);
}
.ff-step-active {
  border-color: rgba(123, 97, 255, 0.8);
  background: rgba(123, 97, 255, 0.2);
  color: #f9f8ff;
  font-weight: 700;
}
.ff-step-done {
  border-color: rgba(91, 255, 173, 0.45);
  color: rgba(220, 255, 232, 0.95);
  background: rgba(73, 191, 131, 0.12);
}
.ff-spinner {
  width: 42px;
  height: 42px;
  margin: 0 auto 14px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.16);
  border-top-color: var(--ff-primary);
  animation: ff-spin 1s linear infinite;
}
.ff-progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
  margin-top: 12px;
}
.ff-progress > span {
  display: block;
  height: 100%;
  width: 0;
  background: var(--ff-primary);
  transition: width 0.3s ease;
}

.ff-video {
  width: 100%;
  border-radius: 14px;
  display: none;
}
.ff-canvas {
  width: 100%;
  border-radius: 14px;
  background: #0a0b12;
  display: block;
}
.ff-slider {
  width: 100%;
  margin: 14px 0;
  accent-color: var(--ff-primary);
}
.ff-error {
  color: #fca5a5;
  font-size: 13px;
  margin: 8px 0;
}

.ff-advisor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 4px;
}
.ff-advisor-locked {
  border: 1px solid rgba(255, 177, 92, 0.42);
  background: rgba(255, 177, 92, 0.1);
  border-radius: 14px;
  padding: 14px;
  color: #ffe4c2;
  line-height: 1.45;
}
.ff-chat-list {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  max-height: 320px;
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ff-chat-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ff-chat-user {
  align-items: flex-end;
}
.ff-chat-assistant {
  align-items: flex-start;
}
.ff-chat-bubble {
  max-width: min(92%, 500px);
  border-radius: 14px;
  padding: 10px 12px;
  line-height: 1.45;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
}
.ff-chat-user .ff-chat-bubble {
  border-color: rgba(123, 97, 255, 0.88);
  background: linear-gradient(120deg, #7b61ff, #4f46e5);
  color: #fff;
}
.ff-chat-bubble-loading {
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.1);
}
.ff-advisor-input-wrap {
  margin-top: 10px;
}
.ff-advisor-input {
  width: 100%;
  resize: vertical;
  min-height: 82px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}
.ff-advisor-input::placeholder {
  color: rgba(255, 255, 255, 0.48);
}
.ff-advisor-input:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.58);
}
.ff-advisor-empty {
  border: 1px dashed rgba(255, 255, 255, 0.22);
  border-radius: 12px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 13px;
  background: rgba(255, 255, 255, 0.03);
}
.ff-advisor-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
  gap: 8px;
  width: 100%;
}
.ff-advisor-card {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
}
.ff-advisor-card-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.08);
}
.ff-advisor-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ff-advisor-card-name {
  color: #ffffff !important;
  font-size: 14px !important;
  line-height: 1.35 !important;
}
.ff-advisor-card-category {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
}
.ff-advisor-card-code {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.ff-advisor-card-cta {
  width: auto;
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
}
.ff-advisor-inline-error {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ff-advisor-retry {
  width: auto;
  align-self: flex-start;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.ff-mode:focus-visible,
.ff-size:focus-visible,
.ff-btn:focus-visible,
.ff-close:focus-visible,
.ff-advisor-input:focus-visible,
.ff-drop:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.35);
}

@keyframes ff-spin { to { transform: rotate(360deg); } }
@keyframes ff-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ff-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 760px) {
  .ff-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .ff-modal {
    width: 100vw;
    height: min(100dvh, 100vh);
    max-height: min(100dvh, 100vh);
    border-radius: 18px 18px 0 0;
    padding: 20px 16px 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
  .ff-h {
    font-size: 31px !important;
  }
  .ff-modes {
    grid-template-columns: 1fr;
  }
  .ff-mode {
    min-height: 108px;
    border-radius: 15px;
  }
  .ff-mode .ff-mode-label {
    font-size: 18px !important;
  }
  .ff-size {
    min-width: 56px;
    padding: 10px 11px;
    border-radius: 13px;
    font-size: 14px;
  }
  .ff-privacy {
    font-size: 12px;
  }
  .ff-result {
    max-height: 50vh;
  }
  .ff-steps {
    grid-template-columns: 1fr;
  }
  .ff-chat-list {
    max-height: 36vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ff-fab,
  .ff-mode,
  .ff-btn,
  .ff-overlay,
  .ff-modal,
  .ff-spinner {
    animation: none !important;
    transition: none !important;
  }
}
`;function nt(n){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",n);let a=document.createElement("style");a.id="ff-styles",a.textContent=zt,document.head.appendChild(a)}function it(n){let a={"X-API-Key":n.apiKey,"Content-Type":"application/json"};async function s(e,i={}){let f=await fetch(n.apiUrl+e,{headers:a,...i}),p=await f.json().catch(()=>({}));if(!f.ok){let l=new Error(p.error||p.message||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${f.status})`);throw l.status=f.status,l.code=p.code||null,l.payload=p,l}return p}return{getProducts(){return s(`/api/widget/products/${n.shopId}`)},startPhotoTryon(e,i,f){return s("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:n.shopId,productId:e,personImageBase64:i,preferredProvider:n.tryonProvider||"auto",metadata:{...f||{},preferredProvider:n.tryonProvider||"auto"}})})},getTryonStatus(e){return s(`/api/widget/tryon/status/${e}`)},getModules(){return s(`/api/widget/modules/${n.shopId}`)},advisorChat(e,i=null){let f={shopId:n.shopId,message:e};return i&&(f.conversationId=i),s("/api/widget/advisor/chat",{method:"POST",body:JSON.stringify(f)})},trackEvent(e,i={}){return s("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:n.shopId,eventType:e,...i})}).catch(()=>{})}}}var jt="0.10.14",st=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${jt}`,St=`${st}/wasm`,It="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",K;function _t(){return K||(K=new Function("u","return import(u)")(st)),K}async function ft({video:n,canvas:a,garmentUrl:s}){let e=a.getContext("2d"),i=null,f=null,p=null,l=!1,k=1,h=new Image;h.crossOrigin="anonymous",s&&(h.src=s);let _=await _t(),O=await _.FilesetResolver.forVisionTasks(St);f=await _.PoseLandmarker.createFromOptions(O,{baseOptions:{modelAssetPath:It,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),i=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),n.srcObject=i,await n.play(),a.width=n.videoWidth||640,a.height=n.videoHeight||480,l=!0,P();function P(){if(l){if(e.drawImage(n,0,0,a.width,a.height),f&&n.readyState>=2)try{let b=f.detectForVideo(n,performance.now()),S=b.landmarks&&b.landmarks[0];S&&E(S)}catch{}p=requestAnimationFrame(P)}}function E(b){if(!h.complete||!h.naturalWidth)return;let S=b[12],L=b[11];if(!S||!L)return;let A=a.width,x=a.height,I=S.x*A,C=S.y*x,D=L.x*A,N=L.y*x,M=Math.hypot(D-I,N-C)*1.8*k,U=h.naturalHeight/h.naturalWidth,y=M*U,R=(I+D)/2,z=(C+N)/2-y*.15;e.save(),e.globalAlpha=.92,e.drawImage(h,R-M/2,z,M,y),e.restore()}function j(){if(l=!1,p&&cancelAnimationFrame(p),i&&i.getTracks().forEach(b=>b.stop()),f&&f.close)try{f.close()}catch{}}return{setScale(b){k=b},capture(){return a.toDataURL("image/jpeg",.92)},stop:j}}var Pt=["XS","S","M","L","XL","XXL"],Lt=3e3,At=20;function dt({config:n,api:a,product:s,externalId:e}){let i=W(),f=s.name||i.name,p=s.garment_image_url||i.image,l=null,k=null,h=null,_="M",O=null,P=[],E="",j=!1,b="",S="",L=!1,A=!1,x=null,I="",C=!1,D=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:$},n.buttonLabel);function N(){document.body.appendChild(D)}function $(){l&&l.remove(),O=null,P=[],E="",j=!1,b="",S="",L=!1,A=!1,x=null,I="",C=!1,k=t("div",{class:"ff-modal-body"}),l=t("div",{class:"ff-overlay",onclick:o=>{o.target===l&&M()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:M},"\xD7"),k)),document.body.appendChild(l),requestAnimationFrame(()=>l.classList.add("ff-open")),z(),a.trackEvent("widget_open",{productId:s.id})}function M(){if(a.trackEvent("close",{productId:s.id}),U(),l){let o=l;o.classList.remove("ff-open"),setTimeout(()=>o.remove(),200),l=null}}function U(){h&&(h.stop(),h=null)}function y(...o){k.innerHTML="",o.forEach(r=>k.appendChild(r))}function R(){return t("div",{class:"ff-product"},p?t("img",{src:p,alt:f}):null,t("b",{},f))}function z(){U();let o=t("div",{class:"ff-sizes"},...Pt.map(r=>{let c=t("button",{class:`ff-size${r===_?" ff-active":""}`,type:"button",onclick:()=>{_=r,o.querySelectorAll(".ff-size").forEach(d=>d.classList.remove("ff-active")),c.classList.add("ff-active")}},r);return c}));y(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),t("div",{class:"ff-sub"},"Try-On i AI Stylist w jednym miejscu"),R(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:q},t("span",{class:"ff-emoji"},"\u2197"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:bt},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u25C9"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki")),t("button",{class:"ff-mode",type:"button",onclick:F},t("span",{class:"ff-emoji"},"\u2726"),t("span",{class:"ff-mode-label"},"AI Stylist"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),o,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function ct(o){let c=(Array.isArray(o&&o.modules)?o.modules:[]).find(d=>d&&d.key==="ai_stylist_advisor");return!!(c&&c.enabled)}function pt(o){if(!o)return null;try{let r=new URL(String(o));return r.protocol==="http:"||r.protocol==="https:"?r.toString():null}catch{return null}}async function ut(){if(!C){C=!0,I="",x=null;try{let o=await a.getModules();L=!0,A=ct(o),A||(x={code:"MODULE_LOCKED",message:"Advisor module is locked for this shop",upgrade:{requiredModule:"ai_stylist_advisor",action:"upgrade_plan"}})}catch(o){I=o&&o.message?o.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 dost\u0119pno\u015Bci modu\u0142u."}finally{C=!1,l&&F()}}}function gt(o){return!Array.isArray(o)||o.length===0?t("div",{class:"ff-advisor-empty"},"Brak dopasowanych produkt\xF3w dla tej wiadomo\u015Bci."):t("div",{class:"ff-advisor-cards"},...o.slice(0,3).map(r=>{let c=pt(r&&r.productUrl),d=r&&(r.externalId||r.productId)?String(r.externalId||r.productId):"";return t("div",{class:"ff-advisor-card"},r&&r.garmentImageUrl?t("img",{class:"ff-advisor-card-image",src:r.garmentImageUrl,alt:r.name||"Produkt"}):null,t("div",{class:"ff-advisor-card-body"},t("b",{class:"ff-advisor-card-name"},r&&r.name?r.name:"Produkt"),r&&r.category?t("div",{class:"ff-advisor-card-category"},r.category):null,d?t("div",{class:"ff-advisor-card-code"},`ID: ${d}`):null,c?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-card-cta",type:"button",onclick:()=>window.open(c,"_blank","noopener,noreferrer")},"Zobacz produkt"):null))}))}function F(){if(U(),!L&&!I&&!x){y(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-loading"},t("div",{class:"ff-spinner"}),t("div",{class:"ff-sub"},"Sprawdzam dost\u0119pno\u015B\u0107 modu\u0142u...")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107"))),ut();return}if(I){y(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-error"},I),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{I="",L=!1,x=null,F()}},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")));return}if(!A||x){let d=x&&(x.message||x.error)||"Advisor module is locked for this shop";y(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-locked"},t("b",{},"Modu\u0142 niedost\u0119pny"),t("div",{},d),t("div",{class:"ff-sub"},"Aby odblokowa\u0107 ten modu\u0142, przejd\u017A na wy\u017Cszy plan.")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{L=!1,A=!1,x=null,I="",F()}},"Sprawd\u017A ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")));return}async function o(d,g={}){let{retry:m=!1}=g;if(j)return;let w=String(d||"").trim();if(w){j=!0,b="",S=w,m||(P=P.concat([{role:"user",text:w}]),E=""),F();try{let u=await a.advisorChat(w,O);u&&u.conversationId&&(O=u.conversationId),P=P.concat([{role:"assistant",text:u&&u.reply?u.reply:"Oto rekomendacje z Twojego katalogu.",recommendations:Array.isArray(u&&u.recommendations)?u.recommendations.slice(0,3):[]}])}catch(u){u&&u.code==="MODULE_LOCKED"?(x=u.payload||{code:"MODULE_LOCKED",message:u.message||"Advisor module is locked for this shop"},A=!1):b=u&&u.message?u.message:"Nie uda\u0142o si\u0119 wys\u0142a\u0107 wiadomo\u015Bci."}finally{j=!1,l&&F()}}}let r=P.length>0?P.map(d=>t("div",{class:`ff-chat-row ff-chat-${d.role==="user"?"user":"assistant"}`},t("div",{class:"ff-chat-bubble"},d.text||""),d.role==="assistant"?gt(d.recommendations||[]):null)):[t("div",{class:"ff-advisor-empty"},"Napisz, czego szukasz, a AI Stylist podpowie produkty z katalogu tego sklepu.")];j&&r.push(t("div",{class:"ff-chat-row ff-chat-assistant"},t("div",{class:"ff-chat-bubble ff-chat-bubble-loading"},"Przygotowuj\u0119 propozycje...")));let c=t("textarea",{class:"ff-advisor-input",rows:"3",maxlength:"1000",placeholder:"Np. Szukam letniej sukienki na wesele",value:E,oninput:d=>{E=d.target.value||"",b&&(b="",F())}});j&&c.setAttribute("disabled","true"),y(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),R(),t("div",{class:"ff-chat-list"},r),b?t("div",{class:"ff-error ff-advisor-inline-error"},b,S?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-retry",type:"button",onclick:()=>o(S,{retry:!0}),disabled:j?"true":null},"Spr\xF3buj ponownie"):null):null,t("div",{class:"ff-advisor-input-wrap"},c),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>o(E),disabled:j||!E.trim()?"true":null},j?"Wysy\u0142anie...":"Wy\u015Blij"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function q(){let o=null,r=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),d=t("div",{class:"ff-error",style:{display:"none"}}),g=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>vt()},"Przymierz"),m=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB")),w=t("div",{class:"ff-upload-wrap"},m),u=t("img",{class:"ff-preview",alt:"Podgl\u0105d zdj\u0119cia"}),H=t("div",{class:"ff-upload-meta"}),yt=t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>c.click()},"Zmie\u0144 zdj\u0119cie"),X=t("div",{class:"ff-upload-card",style:{display:"none"}},u,H,yt);function J(v){d.textContent=v,d.style.display=v?"block":"none"}async function Z(v){let T=et(v);if(T){J(T);return}J(""),o=await at(v);try{r=await ot(o)}catch{r={output_quality:"max"}}u.src=o,H.textContent=r&&r.image_width&&r.image_height?`Rozdzielczo\u015B\u0107: ${r.image_width}\xD7${r.image_height} \xB7 ${r.image_megapixels} MP \xB7 jako\u015B\u0107 wej\u015Bciowa: ${r.image_quality_bucket}`:"Jako\u015B\u0107 wej\u015Bciowa: automatycznie wykryta",m.style.display="none",X.style.display="block",g.removeAttribute("disabled")}m.addEventListener("click",()=>c.click()),m.addEventListener("dragover",v=>{v.preventDefault(),m.classList.add("ff-over")}),m.addEventListener("dragleave",()=>m.classList.remove("ff-over")),m.addEventListener("drop",v=>{v.preventDefault(),m.classList.remove("ff-over"),v.dataTransfer.files[0]&&Z(v.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&Z(c.files[0])});async function vt(){if(!o)return;let v={mode:"photo",size:_,output_quality:"max",...r||{}};a.trackEvent("tryon_start",{productId:s.id,metadata:v}),Y();try{let{sessionId:T}=await a.startPhotoTryon(s.id,o,v);mt(T)}catch(T){B(T.message)}}y(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),w,X,c,d,t("div",{class:"ff-actions"},g,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function Y(){let o=t("span",{}),r=[t("div",{class:"ff-step ff-step-active"},"1. Analiza zdj\u0119cia"),t("div",{class:"ff-step"},"2. Dopasowanie produktu"),t("div",{class:"ff-step"},"3. Render HD"),t("div",{class:"ff-step"},"4. Finalizacja")],c=t("div",{class:"ff-steps"},r);y(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"Zachowujemy najwy\u017Csz\u0105 jako\u015B\u0107 finalnego zdj\u0119cia"),c,t("div",{class:"ff-progress"},o)));let d=5,g=0,m=setInterval(()=>{d=Math.min(90,d+6),o.style.width=`${d}%`,d>=25&&g<1&&(g=1),d>=55&&g<2&&(g=2),d>=80&&g<3&&(g=3),r.forEach((w,u)=>{w.classList.remove("ff-step-done","ff-step-active"),u<g&&w.classList.add("ff-step-done"),u===g&&w.classList.add("ff-step-active")}),l||clearInterval(m)},700);return()=>{clearInterval(m),o.style.width="100%",r.forEach(w=>{w.classList.remove("ff-step-active"),w.classList.add("ff-step-done")})}}function mt(o){let r=0,c=Y(),d=setInterval(async()=>{if(r+=1,!l){clearInterval(d);return}try{let{status:g,resultImageUrl:m}=await a.getTryonStatus(o);g==="completed"&&m?(clearInterval(d),c(),G(m)):(g==="failed"||r>=At)&&(clearInterval(d),B("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(g){clearInterval(d),B(g.message)}},Lt)}function B(o){y(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},o),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:q},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function G(o){a.trackEvent("tryon_complete",{productId:s.id,metadata:{size:_,output_quality:"max"}}),y(t("div",{class:"ff-result-head"},t("h2",{class:"ff-h"},"Twoja przymiarka"),t("div",{class:"ff-result-pills"},t("span",{class:"ff-pill"},`Rozmiar ${_}`),t("span",{class:"ff-pill"},"MAX QUALITY"))),t("div",{class:"ff-result-stage"},t("img",{class:"ff-result",src:o,alt:"Wynik przymiarki"})),t("div",{class:"ff-result-note"},"Wskaz\xF3wka: najlepiej dzia\u0142a zdj\u0119cie samego ubrania bez torebki i dodatk\xF3w."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:xt},"Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>window.open(o,"_blank","noopener,noreferrer")},"Otw\xF3rz pe\u0142ny podgl\u0105d"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{a.trackEvent("download",{productId:s.id}),rt(o,"fashionfit.jpg")}},"Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"Przymierz inne")))}async function bt(){let o=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),r=t("canvas",{class:"ff-canvas"}),c=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),d=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");c.addEventListener("input",()=>{h&&h.setScale(parseFloat(c.value))}),y(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),d,o,r,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),c,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:g},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107"))),a.trackEvent("tryon_start",{productId:s.id,metadata:{mode:"ar",size:_}});try{h=await ft({video:o,canvas:r,garmentUrl:s.garment_image_url}),d.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{ht()}function g(){if(!h)return;let m=h.capture();U(),G(m)}}function ht(){U(),y(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:q},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}async function xt(){if(a.trackEvent("add_to_cart",{productId:s.id,metadata:{size:_}}),!e){s.product_url&&(window.location=s.product_url);return}try{let o=new FormData;o.append("product_id",e),o.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:o}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),M()}catch{window.location=`${location.pathname}?add-to-cart=${e}`}}return{mount:N,open:$,close:M}}var Et=document.currentScript;async function lt(){let n=V(Et);if(!n.apiKey||!n.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!Q())return;let a=tt();nt(n.primaryColor);let s=it(n),e=null;if(a)try{let{products:i}=await s.getProducts(),f=i||[];if(e=f.find(p=>String(p.external_id)===String(a))||null,!e){let p=location.pathname.replace(/\/+$/,"");e=f.find(l=>{if(!l.product_url)return!1;try{return new URL(l.product_url).pathname.replace(/\/+$/,"")===p}catch{return!1}})||null}if(!e){let p=W(),l=k=>String(k||"").trim().toLowerCase();e=f.find(k=>l(k.name)===l(p.name))||null}}catch(i){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",i.message)}if(!e){let i=W();e={id:a||`fallback:${location.pathname}`,external_id:a||null,name:i.name||"Produkt",garment_image_url:i.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",a)}if(String(e.category||"").toLowerCase()==="accessories"){console.info("[FashionFit] Pomijam widget try-on dla kategorii accessories.");return}dt({config:n,api:s,product:e,externalId:a}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",lt):lt();})();
