(()=>{function t(r,n={},...i){let a=document.createElement(r);for(let[s,l]of Object.entries(n||{}))l!=null&&(s==="class"?a.className=l:s==="html"?a.innerHTML=l:s==="style"&&typeof l=="object"?Object.assign(a.style,l):s.startsWith("on")&&typeof l=="function"?a.addEventListener(s.slice(2).toLowerCase(),l):a.setAttribute(s,l));for(let s of i.flat())s==null||s===!1||a.appendChild(typeof s=="string"?document.createTextNode(s):s);return a}function yt(r){let n=window.FashionFitConfig||{},i=r||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),a=i&&i.dataset||{};return{apiKey:n.apiKey||a.fashionfitKey||null,shopId:n.shopId||a.fashionfitShop||null,apiUrl:(n.apiUrl||a.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:n.primaryColor||a.fashionfitColor||"#C4883A",buttonLabel:n.buttonLabel||a.fashionfitLabel||"Przymierz wirtualnie \u2728",tryonProvider:n.tryonProvider||a.fashionfitProvider||"auto"}}function vt(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function wt(){let r=document.body.className.match(/postid-(\d+)/);if(r)return r[1];let n=document.querySelector('[id^="product-"]');if(n&&n.id){let s=n.id.match(/^product-(\d+)$/);if(s)return s[1]}let i=document.querySelector('meta[property="product:retailer_item_id"]');if(i&&i.getAttribute("content"))return i.getAttribute("content");let a=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return a?a.getAttribute("data-product_id")||a.getAttribute("value"):null}var Xt=["image/jpeg","image/png"],Gt=10*1024*1024;function kt(r){return r?Xt.includes(r.type)?r.size>Gt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function zt(r){return new Promise((n,i)=>{let a=new FileReader;a.onload=()=>n(a.result),a.onerror=()=>i(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),a.readAsDataURL(r)})}function _t(r){return new Promise((n,i)=>{let a=new Image;a.onload=()=>{let s=Number(a.naturalWidth||a.width||0),l=Number(a.naturalHeight||a.height||0),u=s>0&&l>0?Number((s*l/1e6).toFixed(2)):0,m="unknown";u>=4.5?m="ultra":u>=2?m="high":u>=.9?m="medium":u>0&&(m="low"),n({image_width:s,image_height:l,image_megapixels:u,image_quality_bucket:m,output_quality:"max"})},a.onerror=()=>i(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 rozdzielczo\u015Bci zdj\u0119cia")),a.src=r})}async function St(r,n){try{let a=await(await fetch(r)).blob(),s=URL.createObjectURL(a),l=t("a",{href:s,download:n});document.body.appendChild(l),l.click(),l.remove(),URL.revokeObjectURL(s)}catch{window.open(r,"_blank")}}function Z(){let r=document.querySelector(".product_title, h1.entry-title, h1"),n=document.querySelector('meta[property="og:title"]'),i=document.querySelector('meta[property="og:image"]'),a=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:r&&r.textContent.trim()||n&&n.content||"Produkt",image:a&&(a.currentSrc||a.src)||i&&i.content||null}}var Ht=`
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

.ff-advisor-fab {
  position: fixed !important;
  bottom: 24px !important;
  z-index: 100001 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 124px !important;
  padding: 13px 20px !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  background: linear-gradient(120deg, #7b61ff 0%, #4f46e5 100%) !important;
  color: #fff !important;
  font: 700 14px/1 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  letter-spacing: 0.01em !important;
  cursor: pointer !important;
  box-shadow:
    0 18px 38px rgba(46, 36, 146, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.ff-advisor-fab:hover {
  transform: translateY(-2px);
  box-shadow:
    0 22px 44px rgba(46, 36, 146, 0.56),
    inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
}

.ff-pos-bottom-right {
  right: 24px !important;
}

.ff-pos-bottom-left {
  left: 24px !important;
}

.ff-advisor-bubble {
  position: fixed !important;
  bottom: 88px !important;
  z-index: 100001 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 10px !important;
  max-width: min(280px, calc(100vw - 32px)) !important;
  padding: 12px 12px 12px 14px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  background: rgba(16, 16, 24, 0.94) !important;
  color: rgba(255, 255, 255, 0.92) !important;
  cursor: pointer !important;
  text-align: left !important;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.42) !important;
}

.ff-advisor-bubble-text {
  font-size: 13px !important;
  line-height: 1.35 !important;
  font-weight: 500 !important;
}

.ff-advisor-bubble-close {
  width: 24px !important;
  height: 24px !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.06) !important;
  color: rgba(255, 255, 255, 0.82) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  padding: 0 !important;
  font-size: 16px !important;
  line-height: 1 !important;
}

.ff-product-tryon-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  margin-top: 10px !important;
  padding: 12px 16px !important;
  border-radius: 12px !important;
  border: 1px solid rgba(123, 97, 255, 0.64) !important;
  background: linear-gradient(120deg, #7b61ff, #4f46e5) !important;
  color: #ffffff !important;
  font: 700 14px/1.2 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  cursor: pointer !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important;
}

.ff-product-tryon-cta:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 97, 255, 0.9) !important;
  box-shadow: 0 14px 28px -20px rgba(79, 70, 229, 0.85) !important;
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
  margin-top: 0;
  flex: 1 1 auto;
}
.ff-advisor-input {
  width: 100%;
  resize: vertical;
  min-height: 74px;
  max-height: 180px;
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
.ff-advisor-composer {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  background: linear-gradient(180deg, rgba(10, 10, 16, 0), rgba(10, 10, 16, 0.88) 36%);
}
.ff-advisor-send {
  width: auto;
  min-width: 104px;
  align-self: stretch;
}
.ff-advisor-nav {
  margin-top: 8px;
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
.ff-advisor-fab:focus-visible,
.ff-advisor-bubble:focus-visible,
.ff-product-tryon-cta:focus-visible,
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
  .ff-advisor-composer {
    gap: 6px;
    padding-top: 6px;
  }
  .ff-advisor-send {
    min-width: 96px;
  }
  .ff-advisor-fab {
    bottom: max(16px, env(safe-area-inset-bottom)) !important;
    min-width: 112px !important;
    padding: 12px 16px !important;
    font-size: 13px !important;
  }
  .ff-pos-bottom-right {
    right: 12px !important;
  }
  .ff-pos-bottom-left {
    left: 12px !important;
  }
  .ff-advisor-bubble {
    bottom: calc(max(16px, env(safe-area-inset-bottom)) + 62px) !important;
    max-width: calc(100vw - 24px) !important;
  }
  .ff-product-tryon-cta {
    margin-top: 8px !important;
    padding: 11px 14px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ff-fab,
  .ff-advisor-fab,
  .ff-advisor-bubble,
  .ff-product-tryon-cta,
  .ff-mode,
  .ff-btn,
  .ff-overlay,
  .ff-modal,
  .ff-spinner {
    animation: none !important;
    transition: none !important;
  }
}
`;function It(r){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",r);let n=document.createElement("style");n.id="ff-styles",n.textContent=Ht,document.head.appendChild(n)}function jt(r){let n={"X-API-Key":r.apiKey,"Content-Type":"application/json"};async function i(a,s={}){let l=await fetch(r.apiUrl+a,{headers:n,...s}),u=await l.json().catch(()=>({}));if(!l.ok){let m=new Error(u.error||u.message||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${l.status})`);throw m.status=l.status,m.code=u.code||null,m.payload=u,m}return u}return{getProducts(){return i(`/api/widget/products/${r.shopId}`)},startPhotoTryon(a,s,l){return i("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:r.shopId,productId:a,personImageBase64:s,preferredProvider:r.tryonProvider||"auto",metadata:{...l||{},preferredProvider:r.tryonProvider||"auto"}})})},getTryonStatus(a){return i(`/api/widget/tryon/status/${a}`)},getModules(){return i(`/api/widget/modules/${r.shopId}`)},advisorChat(a,s=null){let l={shopId:r.shopId,message:a};return s&&(l.conversationId=s),i("/api/widget/advisor/chat",{method:"POST",body:JSON.stringify(l)})},trackEvent(a,s={}){return i("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:r.shopId,eventType:a,...s})}).catch(()=>{})}}}var Vt="0.10.14",At=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${Vt}`,Zt=`${At}/wasm`,Jt="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",it;function Qt(){return it||(it=new Function("u","return import(u)")(At)),it}async function Et({video:r,canvas:n,garmentUrl:i}){let a=n.getContext("2d"),s=null,l=null,u=null,m=!1,_=1,v=new Image;v.crossOrigin="anonymous",i&&(v.src=i);let X=await Qt(),J=await X.FilesetResolver.forVisionTasks(Zt);l=await X.PoseLandmarker.createFromOptions(J,{baseOptions:{modelAssetPath:Jt,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),r.srcObject=s,await r.play(),n.width=r.videoWidth||640,n.height=r.videoHeight||480,m=!0,G();function G(){if(m){if(a.drawImage(r,0,0,n.width,n.height),l&&r.readyState>=2)try{let g=l.detectForVideo(r,performance.now()),w=g.landmarks&&g.landmarks[0];w&&h(w)}catch{}u=requestAnimationFrame(G)}}function h(g){if(!v.complete||!v.naturalWidth)return;let w=g[12],C=g[11];if(!w||!C)return;let I=n.width,j=n.height,z=w.x*I,A=w.y*j,B=C.x*I,T=C.y*j,y=Math.hypot(B-z,T-A)*1.8*_,P=v.naturalHeight/v.naturalWidth,U=y*P,W=(z+B)/2,$=(A+T)/2-U*.15;a.save(),a.globalAlpha=.92,a.drawImage(v,W-y/2,$,y,U),a.restore()}function D(){if(m=!1,u&&cancelAnimationFrame(u),s&&s.getTracks().forEach(g=>g.stop()),l&&l.close)try{l.close()}catch{}}return{setScale(g){_=g},capture(){return n.toDataURL("image/jpeg",.92)},stop:D}}var te=["XS","S","M","L","XL","XXL"],ee=3e3,oe=20,Pt="ai_stylist_advisor",ae="virtual_try_on",re=120,ne=40,Lt="Przymierz wirtualnie",st="data-fashionfit-tryon-cta",ie="fashionfit:advisor-bubble-dismissed:",se="Cze\u015B\u0107 \u2728 Powiedz mi, czego szukasz \u2014 okazja, styl, kolor albo rozmiar. Dobior\u0119 co\u015B z produkt\xF3w tego sklepu.";function Mt({config:r,api:n,product:i,externalId:a}){let s=Z(),l=i.name||s.name,u=i.garment_image_url||s.image,m=!!(i&&i.id&&!i._fallback),_=r.launcherPosition==="bottom-left"||r.position==="bottom-left"?"bottom-left":"bottom-right",v=r.enableFloatingAdvisor!==!1,X=r.enableProductTryOnButton!==!1,J=String(r.advisorWelcomeBubble||"").slice(0,re).trim(),G=String(r.productTryOnButtonText||Lt).trim().slice(0,ne)||Lt,h=null,D=null,g=null,w="M",C=null,I=[],j="",z=!1,A="",B="",T=!1,E=!1,y=null,P="",U=!1,W=!1,$=!1,Q="",lt=!1,q=null,ot=null,Y=null,O=null,b=null;function Tt(){lt||(lt=!0,Ut().catch(()=>{}))}function H(e="default"){ct(),h&&h.remove(),C=null,I=[],j="",z=!1,A="",B="",T=!1,E=!1,y=null,P="",U=!1,D=t("div",{class:"ff-modal-body"}),h=t("div",{class:"ff-overlay",onclick:o=>{o.target===h&&tt()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:tt},"\xD7"),D)),document.body.appendChild(h),requestAnimationFrame(()=>h.classList.add("ff-open")),e==="advisor"?F():e==="tryon"?et():L(),n.trackEvent("widget_open",{productId:i.id,metadata:{entryPoint:e}})}function tt(){if(n.trackEvent("close",{productId:i.id}),V(),h){let e=h;e.classList.remove("ff-open"),setTimeout(()=>{e.remove(),$&&!Q&&(ut(),rt(),pt())},200),h=null}}function V(){g&&(g.stop(),g=null)}function S(...e){D.innerHTML="",e.forEach(o=>{o instanceof Node&&D.appendChild(o)})}function at(e,o){let d=(Array.isArray(e&&e.modules)?e.modules:[]).find(p=>p&&p.key===o);return!!(d&&d.enabled)}function ft(){let e=String(r.shopId||"unknown-shop");return`${ie}${e}`}function Ct(){try{return sessionStorage.getItem(ft())==="1"}catch{return!1}}function dt(){try{sessionStorage.setItem(ft(),"1")}catch{}O&&(O.remove(),O=null)}function ct(){Y&&(Y.remove(),Y=null),O&&(O.remove(),O=null),b&&(b.remove(),b=null),q&&(q.disconnect(),q=null)}function Bt(){try{let e=document.querySelector("form.cart .single_add_to_cart_button, .summary .single_add_to_cart_button, button.single_add_to_cart_button");return e?e.closest("form.cart")||e:document.querySelector("form.cart, .summary form.cart")}catch{return null}}function rt(){if(!X||!W||!m){b&&(b.remove(),b=null);return}let e=Bt();if(!(!e||!e.parentNode)){if(!b){let o=document.querySelector(`[${st}="1"]`);o instanceof HTMLButtonElement&&(b=o)}b||(b=t("button",{class:"ff-product-tryon-cta",type:"button",onclick:()=>H("tryon")},G),b.setAttribute(st,"1")),b.className="ff-product-tryon-cta",b.type="button",b.onclick=()=>H("tryon"),b.setAttribute(st,"1"),b.textContent=G,(!b.parentNode||b.parentNode!==e.parentNode||e.nextElementSibling!==b)&&e.insertAdjacentElement("afterend",b)}}function pt(){q||!X||!W||(q=new MutationObserver(()=>{ot&&cancelAnimationFrame(ot),ot=requestAnimationFrame(()=>rt())}),q.observe(document.body,{childList:!0,subtree:!0}))}function ut(){if(!v||!E||(Y||(Y=t("button",{class:`ff-advisor-fab ff-pos-${_}`,type:"button","aria-label":"Otw\xF3rz AI Stylist",onclick:()=>H("advisor")},"AI Stylist"),document.body.appendChild(Y)),!J||Ct()||O))return;let e=t("button",{class:"ff-advisor-bubble-close",type:"button","aria-label":"Zamknij wiadomo\u015B\u0107",onclick:o=>{o.stopPropagation(),dt()}},"\xD7");O=t("button",{class:`ff-advisor-bubble ff-pos-${_}`,type:"button",onclick:()=>{dt(),H("advisor")}},t("span",{class:"ff-advisor-bubble-text"},J),e),document.body.appendChild(O)}async function Ut(){ct(),$=!1,Q="",E=!1,W=!1;try{let e=await n.getModules();E=at(e,Pt),W=at(e,ae)}catch(e){Q=e&&e.message?e.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 modu\u0142\xF3w."}finally{$=!0}!$||Q||(ut(),rt(),pt())}function Ft(){return t("div",{class:"ff-product"},u?t("img",{src:u,alt:l}):null,t("b",{},l))}function L(){V();let e=t("div",{class:"ff-sizes"},...te.map(o=>{let c=t("button",{class:`ff-size${o===w?" ff-active":""}`,type:"button",onclick:()=>{w=o,e.querySelectorAll(".ff-size").forEach(d=>d.classList.remove("ff-active")),c.classList.add("ff-active")}},o);return c}));S(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),t("div",{class:"ff-sub"},"Try-On i AI Stylist w jednym miejscu"),Ft(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:et},t("span",{class:"ff-emoji"},"\u2197"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:$t},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u25C9"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki")),t("button",{class:"ff-mode",type:"button",onclick:F},t("span",{class:"ff-emoji"},"\u2726"),t("span",{class:"ff-mode-label"},"AI Stylist"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),e,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function Rt(e){if(!e)return null;try{let o=new URL(String(e));return o.protocol==="http:"||o.protocol==="https:"?o.toString():null}catch{return null}}async function Nt(){if(!U){U=!0,P="",y=null;try{let e=await n.getModules();T=!0,E=at(e,Pt),E||(y={code:"MODULE_LOCKED",message:"Advisor module is locked for this shop",upgrade:{requiredModule:"ai_stylist_advisor",action:"upgrade_plan"}})}catch(e){P=e&&e.message?e.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 dost\u0119pno\u015Bci modu\u0142u."}finally{U=!1,h&&F()}}}function Dt(e){return!Array.isArray(e)||e.length===0?t("div",{class:"ff-advisor-empty"},"Brak dopasowanych produkt\xF3w dla tej wiadomo\u015Bci."):t("div",{class:"ff-advisor-cards"},...e.slice(0,3).map(o=>{let c=Rt(o&&o.productUrl),d=o&&(o.externalId||o.productId)?String(o.externalId||o.productId):"";return t("div",{class:"ff-advisor-card"},o&&o.garmentImageUrl?t("img",{class:"ff-advisor-card-image",src:o.garmentImageUrl,alt:o.name||"Produkt"}):null,t("div",{class:"ff-advisor-card-body"},t("b",{class:"ff-advisor-card-name"},o&&o.name?o.name:"Produkt"),o&&o.category?t("div",{class:"ff-advisor-card-category"},o.category):null,d?t("div",{class:"ff-advisor-card-code"},`ID: ${d}`):null,c?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-card-cta",type:"button",onclick:()=>window.open(c,"_blank","noopener,noreferrer")},"Zobacz produkt"):null))}))}function F(){if(V(),!T&&!P&&!y){S(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-loading"},t("div",{class:"ff-spinner"}),t("div",{class:"ff-sub"},"Sprawdzam dost\u0119pno\u015B\u0107 modu\u0142u...")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107"))),Nt();return}if(P){S(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-error"},P),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{P="",T=!1,y=null,F()}},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107")));return}if(!E||y){let f=y&&(y.message||y.error)||"Advisor module is locked for this shop";S(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-locked"},t("b",{},"Modu\u0142 niedost\u0119pny"),t("div",{},f),t("div",{class:"ff-sub"},"Aby odblokowa\u0107 ten modu\u0142, przejd\u017A na wy\u017Cszy plan.")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{T=!1,E=!1,y=null,P="",F()}},"Sprawd\u017A ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107")));return}async function e(f,M={}){let{retry:R=!1}=M;if(z)return;let N=String(f||"").trim();if(N){z=!0,A="",B=N,R||(I=I.concat([{role:"user",text:N}]),j=""),F();try{let x=await n.advisorChat(N,C);x&&x.conversationId&&(C=x.conversationId),I=I.concat([{role:"assistant",text:x&&x.reply?x.reply:"Oto rekomendacje z Twojego katalogu.",recommendations:Array.isArray(x&&x.recommendations)?x.recommendations.slice(0,3):[]}])}catch(x){x&&x.code==="MODULE_LOCKED"?(y=x.payload||{code:"MODULE_LOCKED",message:x.message||"Advisor module is locked for this shop"},E=!1):A=x&&x.message?x.message:"Nie uda\u0142o si\u0119 wys\u0142a\u0107 wiadomo\u015Bci."}finally{z=!1,h&&F()}}}let o=I.length>0?I.map(f=>t("div",{class:`ff-chat-row ff-chat-${f.role==="user"?"user":"assistant"}`},t("div",{class:"ff-chat-bubble"},f.text||""),f.role==="assistant"?Dt(f.recommendations||[]):null)):[t("div",{class:"ff-chat-row ff-chat-assistant"},t("div",{class:"ff-chat-bubble"},se))];z&&o.push(t("div",{class:"ff-chat-row ff-chat-assistant"},t("div",{class:"ff-chat-bubble ff-chat-bubble-loading"},"Przygotowuj\u0119 propozycje...")));let c=t("textarea",{class:"ff-advisor-input",rows:"3",maxlength:"1000",placeholder:"Napisz, czego szukasz...",value:j,oninput:f=>{j=f.target.value||"",p(),A&&(A="")},onkeydown:f=>{f.key==="Enter"&&!f.shiftKey&&(f.preventDefault(),e(j))}}),d=t("button",{class:"ff-btn ff-advisor-send",type:"button",onclick:()=>e(j)},z?"Wysy\u0142anie...":"Wy\u015Blij");function p(){z||!j.trim()?d.setAttribute("disabled","true"):d.removeAttribute("disabled")}z&&c.setAttribute("disabled","true"),p(),S(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-chat-list"},o),A?t("div",{class:"ff-error ff-advisor-inline-error"},A,B?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-retry",type:"button",onclick:()=>e(B,{retry:!0}),disabled:z?"true":null},"Spr\xF3buj ponownie"):null):null,t("div",{class:"ff-advisor-composer"},t("div",{class:"ff-advisor-input-wrap"},c),d),t("div",{class:"ff-actions ff-advisor-nav"},t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107"))),requestAnimationFrame(()=>{!h||z||document.activeElement!==c&&c.focus()})}function et(){let e=null,o=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),d=t("div",{class:"ff-error",style:{display:"none"}}),p=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>Kt()},"Przymierz"),f=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB")),M=t("div",{class:"ff-upload-wrap"},f),R=t("img",{class:"ff-preview",alt:"Podgl\u0105d zdj\u0119cia"}),N=t("div",{class:"ff-upload-meta"}),x=t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>c.click()},"Zmie\u0144 zdj\u0119cie"),gt=t("div",{class:"ff-upload-card",style:{display:"none"}},R,N,x);function xt(k){d.textContent=k,d.style.display=k?"block":"none"}async function ht(k){let K=kt(k);if(K){xt(K);return}xt(""),e=await zt(k);try{o=await _t(e)}catch{o={output_quality:"max"}}R.src=e,N.textContent=o&&o.image_width&&o.image_height?`Rozdzielczo\u015B\u0107: ${o.image_width}\xD7${o.image_height} \xB7 ${o.image_megapixels} MP \xB7 jako\u015B\u0107 wej\u015Bciowa: ${o.image_quality_bucket}`:"Jako\u015B\u0107 wej\u015Bciowa: automatycznie wykryta",f.style.display="none",gt.style.display="block",p.removeAttribute("disabled")}f.addEventListener("click",()=>c.click()),f.addEventListener("dragover",k=>{k.preventDefault(),f.classList.add("ff-over")}),f.addEventListener("dragleave",()=>f.classList.remove("ff-over")),f.addEventListener("drop",k=>{k.preventDefault(),f.classList.remove("ff-over"),k.dataTransfer.files[0]&&ht(k.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&ht(c.files[0])});async function Kt(){if(!e)return;let k={mode:"photo",size:w,output_quality:"max",...o||{}};n.trackEvent("tryon_start",{productId:i.id,metadata:k}),mt();try{let{sessionId:K}=await n.startPhotoTryon(i.id,e,k);Wt(K)}catch(K){nt(K.message)}}S(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),M,gt,c,d,t("div",{class:"ff-actions"},p,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107")))}function mt(){let e=t("span",{}),o=[t("div",{class:"ff-step ff-step-active"},"1. Analiza zdj\u0119cia"),t("div",{class:"ff-step"},"2. Dopasowanie produktu"),t("div",{class:"ff-step"},"3. Render HD"),t("div",{class:"ff-step"},"4. Finalizacja")],c=t("div",{class:"ff-steps"},o);S(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"Zachowujemy najwy\u017Csz\u0105 jako\u015B\u0107 finalnego zdj\u0119cia"),c,t("div",{class:"ff-progress"},e)));let d=5,p=0,f=setInterval(()=>{d=Math.min(90,d+6),e.style.width=`${d}%`,d>=25&&p<1&&(p=1),d>=55&&p<2&&(p=2),d>=80&&p<3&&(p=3),o.forEach((M,R)=>{M.classList.remove("ff-step-done","ff-step-active"),R<p&&M.classList.add("ff-step-done"),R===p&&M.classList.add("ff-step-active")}),h||clearInterval(f)},700);return()=>{clearInterval(f),e.style.width="100%",o.forEach(M=>{M.classList.remove("ff-step-active"),M.classList.add("ff-step-done")})}}function Wt(e){let o=0,c=mt(),d=setInterval(async()=>{if(o+=1,!h){clearInterval(d);return}try{let{status:p,resultImageUrl:f}=await n.getTryonStatus(e);p==="completed"&&f?(clearInterval(d),c(),bt(f)):(p==="failed"||o>=oe)&&(clearInterval(d),nt("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(p){clearInterval(d),nt(p.message)}},ee)}function nt(e){S(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},e),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:et},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107")))}function bt(e){n.trackEvent("tryon_complete",{productId:i.id,metadata:{size:w,output_quality:"max"}}),S(t("div",{class:"ff-result-head"},t("h2",{class:"ff-h"},"Twoja przymiarka"),t("div",{class:"ff-result-pills"},t("span",{class:"ff-pill"},`Rozmiar ${w}`),t("span",{class:"ff-pill"},"MAX QUALITY"))),t("div",{class:"ff-result-stage"},t("img",{class:"ff-result",src:e,alt:"Wynik przymiarki"})),t("div",{class:"ff-result-note"},"Wskaz\xF3wka: najlepiej dzia\u0142a zdj\u0119cie samego ubrania bez torebki i dodatk\xF3w."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:Yt},"Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>window.open(e,"_blank","noopener,noreferrer")},"Otw\xF3rz pe\u0142ny podgl\u0105d"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{n.trackEvent("download",{productId:i.id}),St(e,"fashionfit.jpg")}},"Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"Przymierz inne")))}async function $t(){let e=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),o=t("canvas",{class:"ff-canvas"}),c=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),d=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");c.addEventListener("input",()=>{g&&g.setScale(parseFloat(c.value))}),S(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),d,e,o,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),c,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:p},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107"))),n.trackEvent("tryon_start",{productId:i.id,metadata:{mode:"ar",size:w}});try{g=await Et({video:e,canvas:o,garmentUrl:i.garment_image_url}),d.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{qt()}function p(){if(!g)return;let f=g.capture();V(),bt(f)}}function qt(){V(),S(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:et},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:L},"\u2190 Wr\xF3\u0107")))}async function Yt(){if(n.trackEvent("add_to_cart",{productId:i.id,metadata:{size:w}}),!a){i.product_url&&(window.location=i.product_url);return}try{let e=new FormData;e.append("product_id",a),e.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:e}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),tt()}catch{window.location=`${location.pathname}?add-to-cart=${a}`}}return{mount:Tt,open:H,close:tt}}var le=document.currentScript;async function Ot(){let r=yt(le);if(!r.apiKey||!r.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}let n=vt(),i=n?wt():null;It(r.primaryColor);let a=jt(r),s=null;if(n&&i)try{let{products:l}=await a.getProducts(),u=l||[];if(s=u.find(m=>String(m.external_id)===String(i))||null,!s){let m=location.pathname.replace(/\/+$/,"");s=u.find(_=>{if(!_.product_url)return!1;try{return new URL(_.product_url).pathname.replace(/\/+$/,"")===m}catch{return!1}})||null}if(!s){let m=Z(),_=v=>String(v||"").trim().toLowerCase();s=u.find(v=>_(v.name)===_(m.name))||null}}catch(l){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",l.message)}if(!s)if(n){let l=Z();s={id:i||`fallback:${location.pathname}`,external_id:i||null,name:l.name||"Produkt",garment_image_url:l.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",i)}else s={id:`global:${location.pathname||"/"}`,external_id:null,name:"AI Stylist",garment_image_url:null,product_url:null,category:null,variants:null,_fallback:!0};if(n&&String(s.category||"").toLowerCase()==="accessories"){console.info("[FashionFit] Pomijam widget try-on dla kategorii accessories.");return}Mt({config:r,api:a,product:s,externalId:i}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ot):Ot();})();
