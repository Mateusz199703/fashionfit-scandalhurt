(()=>{function t(r,n={},...i){let a=document.createElement(r);for(let[s,d]of Object.entries(n||{}))d!=null&&(s==="class"?a.className=d:s==="html"?a.innerHTML=d:s==="style"&&typeof d=="object"?Object.assign(a.style,d):s.startsWith("on")&&typeof d=="function"?a.addEventListener(s.slice(2).toLowerCase(),d):a.setAttribute(s,d));for(let s of i.flat())s==null||s===!1||a.appendChild(typeof s=="string"?document.createTextNode(s):s);return a}function _t(r){let n=window.FashionFitConfig||{},i=r||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),a=i&&i.dataset||{};return{apiKey:n.apiKey||a.fashionfitKey||null,shopId:n.shopId||a.fashionfitShop||null,apiUrl:(n.apiUrl||a.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:n.primaryColor||a.fashionfitColor||"#C4883A",buttonLabel:n.buttonLabel||a.fashionfitLabel||"Przymierz wirtualnie \u2728",tryonProvider:n.tryonProvider||a.fashionfitProvider||"auto"}}function St(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function jt(){let r=document.body.className.match(/postid-(\d+)/);if(r)return r[1];let n=document.querySelector('[id^="product-"]');if(n&&n.id){let s=n.id.match(/^product-(\d+)$/);if(s)return s[1]}let i=document.querySelector('meta[property="product:retailer_item_id"]');if(i&&i.getAttribute("content"))return i.getAttribute("content");let a=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return a?a.getAttribute("data-product_id")||a.getAttribute("value"):null}var oe=["image/jpeg","image/png"],ae=10*1024*1024;function At(r){return r?oe.includes(r.type)?r.size>ae?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function It(r){return new Promise((n,i)=>{let a=new FileReader;a.onload=()=>n(a.result),a.onerror=()=>i(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),a.readAsDataURL(r)})}function Lt(r){return new Promise((n,i)=>{let a=new Image;a.onload=()=>{let s=Number(a.naturalWidth||a.width||0),d=Number(a.naturalHeight||a.height||0),m=s>0&&d>0?Number((s*d/1e6).toFixed(2)):0,b="unknown";m>=4.5?b="ultra":m>=2?b="high":m>=.9?b="medium":m>0&&(b="low"),n({image_width:s,image_height:d,image_megapixels:m,image_quality_bucket:b,output_quality:"max"})},a.onerror=()=>i(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 rozdzielczo\u015Bci zdj\u0119cia")),a.src=r})}async function Et(r,n){try{let a=await(await fetch(r)).blob(),s=URL.createObjectURL(a),d=t("a",{href:s,download:n});document.body.appendChild(d),d.click(),d.remove(),URL.revokeObjectURL(s)}catch{window.open(r,"_blank")}}function et(){let r=document.querySelector(".product_title, h1.entry-title, h1"),n=document.querySelector('meta[property="og:title"]'),i=document.querySelector('meta[property="og:image"]'),a=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:r&&r.textContent.trim()||n&&n.content||"Produkt",image:a&&(a.currentSrc||a.src)||i&&i.content||null}}var re=`
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
  gap: 8px !important;
  min-width: 138px !important;
  padding: 12px 18px !important;
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
.ff-advisor-fab-core{
  width: 20px !important;
  height: 20px !important;
  border-radius: 999px !important;
  display: inline-block !important;
  background: radial-gradient(circle at 32% 28%, #93a4ff 0%, #6f7cff 45%, #8b5cff 72%, #ffb15c 100%) !important;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.22), 0 8px 20px rgba(33, 22, 124, 0.45) !important;
}
.ff-advisor-fab-label{
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
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
  max-width: min(290px, calc(100vw - 32px)) !important;
  padding: 12px 12px 12px 14px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(123, 97, 255, 0.26) !important;
  background: rgba(255, 255, 255, 0.96) !important;
  color: #2a2a3c !important;
  cursor: pointer !important;
  text-align: left !important;
  box-shadow: 0 20px 44px rgba(50, 40, 140, 0.2) !important;
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
  border: 1px solid rgba(123, 97, 255, 0.28) !important;
  background: rgba(123, 97, 255, 0.08) !important;
  color: rgba(43, 36, 86, 0.85) !important;
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
.ff-overlay.ff-overlay-advisor {
  background:
    radial-gradient(circle at 14% 0%, rgba(123, 97, 255, 0.16), transparent 42%),
    radial-gradient(circle at 92% 100%, rgba(79, 70, 229, 0.12), transparent 46%),
    rgba(15, 18, 31, 0.34);
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
.ff-modal.ff-modal-advisor{
  width: min(400px, calc(100vw - 24px));
  height: min(660px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
  border-radius: 30px;
  padding: 0;
  background: #ffffff;
  color: #16182d;
  border: 1px solid rgba(17, 17, 24, 0.12);
  box-shadow:
    0 28px 70px rgba(15, 21, 41, 0.26),
    0 1px 0 rgba(255, 255, 255, 0.85) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ff-modal.ff-modal-advisor::before{
  border-radius: 30px;
  background: none;
}
.ff-modal.ff-modal-advisor .ff-modal-body{
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.ff-modal.ff-modal-advisor .ff-close{
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-color: rgba(17, 24, 39, 0.12);
  background: #f8f9fc;
  color: #4b5563;
  font-size: 26px !important;
  line-height: 0.74 !important;
}
.ff-modal.ff-modal-advisor .ff-close:hover{
  background: #eef1fa;
  color: #374151;
}
.ff-modal.ff-modal-advisor .ff-sub{
  color:#6b7288;
}
.ff-modal.ff-modal-advisor .ff-error{
  color:#b42345;
}
.ff-modal.ff-modal-advisor .ff-btn-ghost{
  background:#ffffff;
  color:#313857;
  border-color:rgba(17, 24, 39, 0.16);
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

.ff-advisor-header{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0;
  padding: 18px 58px 14px 18px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.1);
  background: #ffffff;
  flex-shrink: 0;
}
.ff-advisor-header-profile{
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ff-advisor-core{
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background: radial-gradient(circle at 32% 26%, #95a4ff 0%, #6978ff 42%, #8b5cff 72%, #ffb15c 100%);
  box-shadow: 0 10px 20px -14px rgba(79, 70, 229, 0.8);
}
.ff-advisor-header-copy b{
  display: block;
  color: #151826;
  font: 700 15px/1.2 "Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
}
.ff-advisor-header-copy span{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}
.ff-advisor-status-dot{
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ecf8e;
  box-shadow: 0 0 0 0 rgba(46, 207, 142, 0.42);
  animation: ff-live-dot 2s infinite;
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
  background: rgba(255, 177, 92, 0.12);
  border-radius: 14px;
  padding: 14px;
  color: #8a5119;
  line-height: 1.45;
}
.ff-chat-list {
  border: none;
  border-radius: 0;
  background: #ffffff;
  max-height: none;
  overflow: auto;
  overflow-x: hidden;
  padding: 16px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}
.ff-chat-day{
  width: max-content;
  margin: 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  border: none;
  background: #f3f4f8;
  color: #8a90a5;
  font-size: 11px;
  letter-spacing: 0.01em;
  text-transform: none;
  font-weight: 600;
}
.ff-chat-row {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  min-width: 0;
  max-width: 90%;
}
.ff-chat-user {
  justify-content: flex-end;
  align-self: flex-end;
  max-width: 88%;
}
.ff-chat-assistant {
  justify-content: flex-start;
  align-self: flex-start;
  max-width: 100%;
}
.ff-chat-avatar{
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #eef1ff;
  border: 1px solid rgba(123, 97, 255, 0.24);
}
.ff-chat-avatar-core{
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: inline-block;
  background: radial-gradient(circle at 32% 28%, #93a4ff 0%, #6f7cff 45%, #8b5cff 72%, #ffb15c 100%);
}
.ff-chat-stack{
  min-width: 0;
  max-width: calc(100% - 37px);
  display: grid;
  gap: 10px;
}
.ff-chat-bubble {
  max-width: 100%;
  border-radius: 17px;
  border-bottom-left-radius: 5px;
  padding: 12px 15px;
  line-height: 1.5;
  font-size: 14px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  background: #f5f6fa;
  color: #111827;
  box-shadow: none;
  overflow-wrap: anywhere;
}
.ff-chat-user .ff-chat-bubble {
  border: none;
  border-radius: 17px;
  border-bottom-right-radius: 5px;
  background: linear-gradient(120deg, #7b61ff, #4f46e5);
  color: #fff;
  box-shadow: 0 12px 24px -18px rgba(79, 70, 229, 0.9);
}
.ff-chat-bubble-loading {
  color: #4e5a83;
  background: #eceffd;
}
.ff-advisor-input-wrap {
  margin-top: 0;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f3f4f7;
  border: 1px solid #e2e5ed;
  border-radius: 999px;
  padding: 9px 12px;
}
.ff-advisor-input-wrap:focus-within {
  border-color: rgba(123, 97, 255, 0.42);
  box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.18);
}
.ff-advisor-input {
  width: 100%;
  resize: none;
  min-height: 22px;
  height: 22px;
  max-height: 180px;
  border: none;
  border-radius: 0;
  padding: 0;
  font-size: 14px;
  line-height: 1.35;
  color: #171720;
  background: transparent;
  overflow-y: auto;
}
.ff-advisor-input:focus,
.ff-advisor-input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
.ff-advisor-input::placeholder {
  color: #8d93a5;
}
.ff-advisor-input:disabled {
  background: transparent;
  color: #858aa3;
}
.ff-advisor-composer {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 0;
  padding: 14px 14px;
  border-top: 1px solid #e5e7ef;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-bottom: none;
  background: #ffffff;
  flex-shrink: 0;
}
.ff-advisor-mic{
  width: 20px;
  min-width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 0;
  border: none;
  color: #8a90a6;
  background: transparent;
  font-size: 16px;
  box-shadow: none;
}
.ff-advisor-mic:hover{
  transform: none;
  filter: none;
  background: transparent;
}
.ff-advisor-send {
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 999px;
  align-self: center;
  border: none;
  font-size: 18px;
  line-height: 1;
}
.ff-advisor-send:hover{
  transform: scale(1.06);
  filter: none;
}
.ff-advisor-send.is-loading {
  font-size: 22px;
}
.ff-advisor-empty {
  border: 1px dashed rgba(123, 97, 255, 0.34);
  border-radius: 12px;
  padding: 12px;
  color: #5b6489;
  font-size: 13px;
  background: rgba(123, 97, 255, 0.04);
}
.ff-advisor-cards {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 0 6px;
  scrollbar-width: none;
  width: 100%;
}
.ff-advisor-cards::-webkit-scrollbar {
  display: none;
}
.ff-advisor-card {
  min-width: 146px;
  width: 146px;
  flex: 0 0 auto;
  border: 1px solid rgba(123, 97, 255, 0.22);
  border-radius: 14px;
  background: #fafafe;
  overflow: hidden;
  box-shadow: none;
}
.ff-advisor-card-image {
  width: 100%;
  height: 124px;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.08);
}
.ff-advisor-card-body {
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ff-advisor-card-name {
  color: #191c30 !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
}
.ff-advisor-card-category {
  color: #5e6487;
  font-size: 11px;
}
.ff-advisor-card-code {
  color: #8f95b2;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.ff-advisor-card-cta {
  width: auto;
  align-self: flex-start;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 11.5px;
  border-color: rgba(123, 97, 255, 0.3);
  color: #2f3763;
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
.ff-advisor-foot{
  margin-top: 0;
  padding: 7px 12px 8px;
  border-top: none;
  color: #7a8094;
  font-size: 10px;
  letter-spacing: 0.04em;
  text-align: center;
  flex-shrink: 0;
}

.ff-mode:focus-visible,
.ff-size:focus-visible,
.ff-btn:focus-visible,
.ff-advisor-fab:focus-visible,
.ff-advisor-bubble:focus-visible,
.ff-product-tryon-cta:focus-visible,
.ff-close:focus-visible,
.ff-drop:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(123, 97, 255, 0.35);
}

@keyframes ff-spin { to { transform: rotate(360deg); } }
@keyframes ff-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ff-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ff-live-dot {
  0% { box-shadow: 0 0 0 0 rgba(46, 207, 142, 0.42); }
  70% { box-shadow: 0 0 0 7px rgba(46, 207, 142, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 207, 142, 0); }
}

@media (max-width: 760px) {
  .ff-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .ff-overlay.ff-overlay-advisor {
    align-items: center;
    padding: 12px;
  }
  .ff-modal {
    width: 100vw;
    height: min(100dvh, 100vh);
    max-height: min(100dvh, 100vh);
    border-radius: 18px 18px 0 0;
    padding: 20px 16px 16px;
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
  .ff-modal.ff-modal-advisor{
    width: calc(100vw - 24px);
    max-width: 400px;
    height: min(660px, calc(100dvh - 24px));
    max-height: calc(100dvh - 24px);
    border-radius: 24px;
    padding: 0;
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
    max-height: none;
    padding: 12px 12px 8px;
  }
  .ff-advisor-header-copy b { font-size: 13px !important; }
  .ff-advisor-header-copy span { font-size: 11px !important; }
  .ff-chat-avatar { width: 24px; height: 24px; }
  .ff-chat-avatar-core { width: 15px; height: 15px; }
  .ff-chat-stack { max-width: calc(100% - 33px); }
  .ff-advisor-card-image {
    height: 108px;
  }
  .ff-advisor-composer {
    gap: 8px;
    padding: 10px 10px;
  }
  .ff-advisor-input-wrap {
    padding: 8px 11px;
  }
  .ff-advisor-mic{
    width: 18px;
    min-width: 18px;
    height: 18px;
    font-size: 15px;
  }
  .ff-advisor-send {
    width: 40px;
    min-width: 40px;
    height: 40px;
  }
  .ff-advisor-input {
    min-height: 20px;
    height: 20px;
  }
  .ff-advisor-fab {
    bottom: max(16px, env(safe-area-inset-bottom)) !important;
    min-width: 124px !important;
    padding: 12px 16px !important;
    font-size: 13px !important;
  }
  .ff-advisor-fab-label { font-size: 13px !important; }
  .ff-advisor-fab-core { width: 18px !important; height: 18px !important; }
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
`;function Pt(r){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",r);let n=document.createElement("style");n.id="ff-styles",n.textContent=re,document.head.appendChild(n)}function Mt(r){let n={"X-API-Key":r.apiKey,"Content-Type":"application/json"};async function i(a,s={}){let d=await fetch(r.apiUrl+a,{headers:n,...s}),m=await d.json().catch(()=>({}));if(!d.ok){let b=new Error(m.error||m.message||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${d.status})`);throw b.status=d.status,b.code=m.code||null,b.payload=m,b}return m}return{getProducts(){return i(`/api/widget/products/${r.shopId}`)},startPhotoTryon(a,s,d){return i("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:r.shopId,productId:a,personImageBase64:s,preferredProvider:r.tryonProvider||"auto",metadata:{...d||{},preferredProvider:r.tryonProvider||"auto"}})})},getTryonStatus(a){return i(`/api/widget/tryon/status/${a}`)},getModules(){return i(`/api/widget/modules/${r.shopId}`)},advisorChat(a,s=null){let d={shopId:r.shopId,message:a};return s&&(d.conversationId=s),i("/api/widget/advisor/chat",{method:"POST",body:JSON.stringify(d)})},trackEvent(a,s={}){return i("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:r.shopId,eventType:a,...s})}).catch(()=>{})}}}var ne="0.10.14",Tt=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ne}`,ie=`${Tt}/wasm`,se="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",mt;function de(){return mt||(mt=new Function("u","return import(u)")(Tt)),mt}async function Ot({video:r,canvas:n,garmentUrl:i}){let a=n.getContext("2d"),s=null,d=null,m=null,b=!1,S=1,w=new Image;w.crossOrigin="anonymous",i&&(w.src=i);let X=await de(),G=await X.FilesetResolver.forVisionTasks(ie);d=await X.PoseLandmarker.createFromOptions(G,{baseOptions:{modelAssetPath:se,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),r.srcObject=s,await r.play(),n.width=r.videoWidth||640,n.height=r.videoHeight||480,b=!0,H();function H(){if(b){if(a.drawImage(r,0,0,n.width,n.height),d&&r.readyState>=2)try{let y=d.detectForVideo(r,performance.now()),j=y.landmarks&&y.landmarks[0];j&&ot(j)}catch{}m=requestAnimationFrame(H)}}function ot(y){if(!w.complete||!w.naturalWidth)return;let j=y[12],z=y[11];if(!j||!z)return;let L=n.width,D=n.height,E=j.x*L,P=j.y*D,v=z.x*L,M=z.y*D,O=Math.hypot(v-E,M-P)*1.8*S,A=w.naturalHeight/w.naturalWidth,k=O*A,T=(E+v)/2,W=(P+M)/2-k*.15;a.save(),a.globalAlpha=.92,a.drawImage(w,T-O/2,W,O,k),a.restore()}function h(){if(b=!1,m&&cancelAnimationFrame(m),s&&s.getTracks().forEach(y=>y.stop()),d&&d.close)try{d.close()}catch{}}return{setScale(y){S=y},capture(){return n.toDataURL("image/jpeg",.92)},stop:h}}var fe=["XS","S","M","L","XL","XXL"],le=3e3,ce=20,Ct="ai_stylist_advisor",pe="virtual_try_on",ue=120,me="Cze\u015B\u0107, jestem Lume. Pomog\u0119 dobra\u0107 stylizacj\u0119 \u2728",be=40,Bt="Przymierz wirtualnie",bt="data-fashionfit-tryon-cta",ge="fashionfit:advisor-bubble-dismissed:",xe="Cze\u015B\u0107! \u{1F44B} Jestem Lume. Powiedz, na jak\u0105 okazj\u0119 szukasz stylizacji?";function Rt({config:r,api:n,product:i,externalId:a}){let s=et(),d=i.name||s.name,m=i.garment_image_url||s.image,b=!!(i&&i.id&&!i._fallback),S=r.launcherPosition==="bottom-left"||r.position==="bottom-left"?"bottom-left":"bottom-right",w=r.enableFloatingAdvisor!==!1,X=r.enableProductTryOnButton!==!1,G=r.advisorWelcomeBubble,H=(G==null?me:String(G||"")).slice(0,ue).trim(),ot=String(r.productTryOnButtonText||Bt).trim().slice(0,be)||Bt,h=null,y=null,j=null,z=null,L="M",D=null,E=[],P="",v=!1,M="",V="",O=!1,A=!1,k=null,T="",W=!1,at=!1,rt=!1,nt="",gt=!1,$=null,ft=null,q=null,C=null,x=null;function Ft(){gt||(gt=!0,Wt().catch(()=>{}))}function Z(e="default"){yt(),h&&h.remove(),D=null,E=[],P="",v=!1,M="",V="",O=!1,A=!1,k=null,T="",W=!1,j=t("div",{class:"ff-modal-body"}),y=t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:it},"\xD7"),j),h=t("div",{class:"ff-overlay",onclick:o=>{o.target===h&&it()}},y),document.body.appendChild(h),requestAnimationFrame(()=>h.classList.add("ff-open")),e==="advisor"?F():e==="tryon"?dt():B(),n.trackEvent("widget_open",{productId:i.id,metadata:{entryPoint:e}})}function it(){if(n.trackEvent("close",{productId:i.id}),J(),h){let e=h;e.classList.remove("ff-open"),setTimeout(()=>{e.remove(),rt&&!nt&&(wt(),ct(),vt())},200),h=null,y=null}}function J(){z&&(z.stop(),z=null)}function I(...e){j.innerHTML="",e.forEach(o=>{o instanceof Node&&j.appendChild(o)})}function st(e="default"){if(!h||!y)return;let o=e==="advisor";h.classList.toggle("ff-overlay-advisor",o),y.classList.toggle("ff-modal-advisor",o)}function lt(e,o){let c=(Array.isArray(e&&e.modules)?e.modules:[]).find(p=>p&&p.key===o);return!!(c&&c.enabled)}function xt(){let e=String(r.shopId||"unknown-shop");return`${ge}${e}`}function Nt(){try{return sessionStorage.getItem(xt())==="1"}catch{return!1}}function ht(){try{sessionStorage.setItem(xt(),"1")}catch{}C&&(C.remove(),C=null)}function yt(){q&&(q.remove(),q=null),C&&(C.remove(),C=null),x&&(x.remove(),x=null),$&&($.disconnect(),$=null)}function Dt(){try{let e=document.querySelector("form.cart .single_add_to_cart_button, .summary .single_add_to_cart_button, button.single_add_to_cart_button");return e?e.closest("form.cart")||e:document.querySelector("form.cart, .summary form.cart")}catch{return null}}function ct(){if(!X||!at||!b){x&&(x.remove(),x=null);return}let e=Dt();if(!(!e||!e.parentNode)){if(!x){let o=document.querySelector(`[${bt}="1"]`);o instanceof HTMLButtonElement&&(x=o)}x||(x=t("button",{class:"ff-product-tryon-cta",type:"button",onclick:()=>Z("tryon")},ot),x.setAttribute(bt,"1")),x.className="ff-product-tryon-cta",x.type="button",x.onclick=()=>Z("tryon"),x.setAttribute(bt,"1"),x.textContent=ot,(!x.parentNode||x.parentNode!==e.parentNode||e.nextElementSibling!==x)&&e.insertAdjacentElement("afterend",x)}}function vt(){$||!X||!at||($=new MutationObserver(()=>{ft&&cancelAnimationFrame(ft),ft=requestAnimationFrame(()=>ct())}),$.observe(document.body,{childList:!0,subtree:!0}))}function wt(){if(!w||!A||(q||(q=t("button",{class:`ff-advisor-fab ff-pos-${S}`,type:"button","aria-label":"Otw\xF3rz Lume \xB7 stylist\u0119 AI",onclick:()=>Z("advisor")},t("span",{class:"ff-advisor-fab-core","aria-hidden":"true"}),t("span",{class:"ff-advisor-fab-label"},"Zapytaj Lume")),document.body.appendChild(q)),!H||Nt()||C))return;let e=t("button",{class:"ff-advisor-bubble-close",type:"button","aria-label":"Zamknij wiadomo\u015B\u0107",onclick:o=>{o.stopPropagation(),ht()}},"\xD7");C=t("button",{class:`ff-advisor-bubble ff-pos-${S}`,type:"button",onclick:()=>{ht(),Z("advisor")}},t("span",{class:"ff-advisor-bubble-text"},H),e),document.body.appendChild(C)}async function Wt(){yt(),rt=!1,nt="",A=!1,at=!1;try{let e=await n.getModules();A=lt(e,Ct),at=lt(e,pe)}catch(e){nt=e&&e.message?e.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 modu\u0142\xF3w."}finally{rt=!0}!rt||nt||(wt(),ct(),vt())}function $t(){return t("div",{class:"ff-product"},m?t("img",{src:m,alt:d}):null,t("b",{},d))}function B(){st("default"),J();let e=t("div",{class:"ff-sizes"},...fe.map(o=>{let l=t("button",{class:`ff-size${o===L?" ff-active":""}`,type:"button",onclick:()=>{L=o,e.querySelectorAll(".ff-size").forEach(c=>c.classList.remove("ff-active")),l.classList.add("ff-active")}},o);return l}));I(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),t("div",{class:"ff-sub"},"Try-On i Lume w jednym miejscu"),$t(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:dt},t("span",{class:"ff-emoji"},"\u2197"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:Jt},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u25C9"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki")),t("button",{class:"ff-mode",type:"button",onclick:F},t("span",{class:"ff-emoji"},"\u2726"),t("span",{class:"ff-mode-label"},"Lume \xB7 stylista AI"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),e,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function qt(e){if(!e)return null;try{let o=new URL(String(e));return o.protocol==="http:"||o.protocol==="https:"?o.toString():null}catch{return null}}async function Yt(){if(!W){W=!0,T="",k=null;try{let e=await n.getModules();O=!0,A=lt(e,Ct),A||(k={code:"MODULE_LOCKED",message:"Advisor module is locked for this shop",upgrade:{requiredModule:"ai_stylist_advisor",action:"upgrade_plan"}})}catch(e){T=e&&e.message?e.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 dost\u0119pno\u015Bci modu\u0142u."}finally{W=!1,h&&F()}}}function Kt(e){return!Array.isArray(e)||e.length===0?null:t("div",{class:"ff-advisor-cards"},...e.slice(0,3).map(o=>{let l=qt(o&&o.productUrl),c=o&&(o.externalId||o.productId)?String(o.externalId||o.productId):"";return t("div",{class:"ff-advisor-card"},o&&o.garmentImageUrl?t("img",{class:"ff-advisor-card-image",src:o.garmentImageUrl,alt:o.name||"Produkt"}):null,t("div",{class:"ff-advisor-card-body"},t("b",{class:"ff-advisor-card-name"},o&&o.name?o.name:"Produkt"),o&&o.category?t("div",{class:"ff-advisor-card-category"},o.category):null,c?t("div",{class:"ff-advisor-card-code"},`ID: ${c}`):null,l?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-card-cta",type:"button",onclick:()=>window.open(l,"_blank","noopener,noreferrer")},"Zobacz produkt"):null))}))}function pt(e){let o=String(e||"").trim().toLowerCase();return o||""}function Xt(e,o){return Array.isArray(o)&&o.length>0?!1:pt(e)==="no_match"}function Gt(e,o){if(!Array.isArray(o)||o.length===0)return!1;let l=pt(e);return l?["browse_catalog","recommend_products","product_search","product_explanation"].includes(l):!0}function Ht(e){return e?t("div",{class:"ff-advisor-empty"},"Brak dopasowanych produkt\xF3w dla tej wiadomo\u015Bci."):null}function Vt(e,o){let l=Gt(o,e)?Kt(e):null;if(l)return l;let c=Xt(o,e);return Ht(c)}function F(){st("advisor"),J();let e=t("div",{class:"ff-advisor-header"},t("div",{class:"ff-advisor-header-profile"},t("span",{class:"ff-advisor-core","aria-hidden":"true"}),t("div",{class:"ff-advisor-header-copy"},t("b",{},"Lume \xB7 stylista AI"),t("span",{},t("i",{class:"ff-advisor-status-dot","aria-hidden":"true"}),"Online \xB7 odpowiada od razu"))));if(!O&&!T&&!k){I(e,t("div",{class:"ff-advisor-loading"},t("div",{class:"ff-spinner"}),t("div",{class:"ff-sub"},"Sprawdzam dost\u0119pno\u015B\u0107 modu\u0142u...")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107"))),Yt();return}if(T){I(e,t("div",{class:"ff-error"},T),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{T="",O=!1,k=null,F()}},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107")));return}if(!A||k){let g=k&&(k.message||k.error)||"Advisor module is locked for this shop";I(e,t("div",{class:"ff-advisor-locked"},t("b",{},"Modu\u0142 niedost\u0119pny"),t("div",{},g),t("div",{class:"ff-sub"},"Aby odblokowa\u0107 ten modu\u0142, przejd\u017A na wy\u017Cszy plan.")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{O=!1,A=!1,k=null,T="",F()}},"Sprawd\u017A ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107")));return}async function o(g,Y={}){let{retry:K=!1}=Y;if(v)return;let R=String(g||"").trim();if(R){v=!0,M="",V=R,K||(E=E.concat([{role:"user",text:R}]),P=""),F();try{let f=await n.advisorChat(R,D);f&&f.conversationId&&(D=f.conversationId);let U=Array.isArray(f&&f.recommendations)?f.recommendations.slice(0,3):[],ee=f&&f.meta?f.meta.responseType:null;E=E.concat([{role:"assistant",text:f&&f.reply?f.reply:"Oto rekomendacje z Twojego katalogu.",recommendations:U,responseType:pt(ee)}])}catch(f){f&&f.code==="MODULE_LOCKED"?(k=f.payload||{code:"MODULE_LOCKED",message:f.message||"Advisor module is locked for this shop"},A=!1):M=f&&f.message?f.message:"Nie uda\u0142o si\u0119 wys\u0142a\u0107 wiadomo\u015Bci."}finally{v=!1,h&&F()}}}function l(g,Y=[],K=null,R=""){return t("div",{class:"ff-chat-row ff-chat-assistant"},t("span",{class:"ff-chat-avatar","aria-hidden":"true"},t("span",{class:"ff-chat-avatar-core","aria-hidden":"true"})),t("div",{class:"ff-chat-stack"},t("div",{class:`ff-chat-bubble${R?` ${R}`:""}`},g||""),Vt(Y||[],K)))}function c(g){return t("div",{class:"ff-chat-row ff-chat-user"},t("div",{class:"ff-chat-bubble"},g||""))}let p=E.length>0?E.map(g=>g.role==="assistant"?l(g.text||"",g.recommendations||[],g.responseType):c(g.text||"")):[l(xe)];v&&p.push(l("Przygotowuj\u0119 propozycje...",[],null,"ff-chat-bubble-loading"));let u=t("textarea",{class:"ff-advisor-input",rows:"1",maxlength:"1000",placeholder:"Napisz wiadomo\u015B\u0107...",value:P,oninput:g=>{P=g.target.value||"",Q(),M&&(M="")},onkeydown:g=>{g.key==="Enter"&&!g.shiftKey&&(g.preventDefault(),o(P))}}),_=t("button",{class:`ff-btn ff-advisor-send${v?" is-loading":""}`,type:"button",onclick:()=>o(P),"aria-label":v?"Wysy\u0142anie wiadomo\u015Bci":"Wy\u015Blij wiadomo\u015B\u0107"},v?"\u2026":"\u27A4"),N=t("button",{class:"ff-btn ff-btn-ghost ff-advisor-mic",type:"button",disabled:"true","aria-disabled":"true","aria-label":"Mikrofon (wkr\xF3tce)"},"\u{1F3A4}");function Q(){v||!P.trim()?_.setAttribute("disabled","true"):_.removeAttribute("disabled")}v&&u.setAttribute("disabled","true"),Q();let tt=t("div",{class:"ff-chat-list"},t("div",{class:"ff-chat-day"},"Dzisiaj"),...p);I(e,tt,M?t("div",{class:"ff-error ff-advisor-inline-error"},M,V?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-retry",type:"button",onclick:()=>o(V,{retry:!0}),disabled:v?"true":null},"Spr\xF3buj ponownie"):null):null,t("div",{class:"ff-advisor-composer"},t("div",{class:"ff-advisor-input-wrap"},u,N),_),t("div",{class:"ff-advisor-foot"},"Nap\u0119dzane przez FashionFit AI \xB7 zgodne z RODO")),requestAnimationFrame(()=>{tt.scrollTop=tt.scrollHeight,!(!h||v)&&document.activeElement!==u&&u.focus()})}function dt(){st("default");let e=null,o=null,l=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),c=t("div",{class:"ff-error",style:{display:"none"}}),p=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>R()},"Przymierz"),u=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB")),_=t("div",{class:"ff-upload-wrap"},u),N=t("img",{class:"ff-preview",alt:"Podgl\u0105d zdj\u0119cia"}),Q=t("div",{class:"ff-upload-meta"}),tt=t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>l.click()},"Zmie\u0144 zdj\u0119cie"),g=t("div",{class:"ff-upload-card",style:{display:"none"}},N,Q,tt);function Y(f){c.textContent=f,c.style.display=f?"block":"none"}async function K(f){let U=At(f);if(U){Y(U);return}Y(""),e=await It(f);try{o=await Lt(e)}catch{o={output_quality:"max"}}N.src=e,Q.textContent=o&&o.image_width&&o.image_height?`Rozdzielczo\u015B\u0107: ${o.image_width}\xD7${o.image_height} \xB7 ${o.image_megapixels} MP \xB7 jako\u015B\u0107 wej\u015Bciowa: ${o.image_quality_bucket}`:"Jako\u015B\u0107 wej\u015Bciowa: automatycznie wykryta",u.style.display="none",g.style.display="block",p.removeAttribute("disabled")}u.addEventListener("click",()=>l.click()),u.addEventListener("dragover",f=>{f.preventDefault(),u.classList.add("ff-over")}),u.addEventListener("dragleave",()=>u.classList.remove("ff-over")),u.addEventListener("drop",f=>{f.preventDefault(),u.classList.remove("ff-over"),f.dataTransfer.files[0]&&K(f.dataTransfer.files[0])}),l.addEventListener("change",()=>{l.files[0]&&K(l.files[0])});async function R(){if(!e)return;let f={mode:"photo",size:L,output_quality:"max",...o||{}};n.trackEvent("tryon_start",{productId:i.id,metadata:f}),kt();try{let{sessionId:U}=await n.startPhotoTryon(i.id,e,f);Zt(U)}catch(U){ut(U.message)}}I(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),_,g,l,c,t("div",{class:"ff-actions"},p,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107")))}function kt(){let e=t("span",{}),o=[t("div",{class:"ff-step ff-step-active"},"1. Analiza zdj\u0119cia"),t("div",{class:"ff-step"},"2. Dopasowanie produktu"),t("div",{class:"ff-step"},"3. Render HD"),t("div",{class:"ff-step"},"4. Finalizacja")],l=t("div",{class:"ff-steps"},o);I(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"Zachowujemy najwy\u017Csz\u0105 jako\u015B\u0107 finalnego zdj\u0119cia"),l,t("div",{class:"ff-progress"},e)));let c=5,p=0,u=setInterval(()=>{c=Math.min(90,c+6),e.style.width=`${c}%`,c>=25&&p<1&&(p=1),c>=55&&p<2&&(p=2),c>=80&&p<3&&(p=3),o.forEach((_,N)=>{_.classList.remove("ff-step-done","ff-step-active"),N<p&&_.classList.add("ff-step-done"),N===p&&_.classList.add("ff-step-active")}),h||clearInterval(u)},700);return()=>{clearInterval(u),e.style.width="100%",o.forEach(_=>{_.classList.remove("ff-step-active"),_.classList.add("ff-step-done")})}}function Zt(e){let o=0,l=kt(),c=setInterval(async()=>{if(o+=1,!h){clearInterval(c);return}try{let{status:p,resultImageUrl:u}=await n.getTryonStatus(e);p==="completed"&&u?(clearInterval(c),l(),zt(u)):(p==="failed"||o>=ce)&&(clearInterval(c),ut("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(p){clearInterval(c),ut(p.message)}},le)}function ut(e){I(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},e),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:dt},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107")))}function zt(e){n.trackEvent("tryon_complete",{productId:i.id,metadata:{size:L,output_quality:"max"}}),I(t("div",{class:"ff-result-head"},t("h2",{class:"ff-h"},"Twoja przymiarka"),t("div",{class:"ff-result-pills"},t("span",{class:"ff-pill"},`Rozmiar ${L}`),t("span",{class:"ff-pill"},"MAX QUALITY"))),t("div",{class:"ff-result-stage"},t("img",{class:"ff-result",src:e,alt:"Wynik przymiarki"})),t("div",{class:"ff-result-note"},"Wskaz\xF3wka: najlepiej dzia\u0142a zdj\u0119cie samego ubrania bez torebki i dodatk\xF3w."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:te},"Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>window.open(e,"_blank","noopener,noreferrer")},"Otw\xF3rz pe\u0142ny podgl\u0105d"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{n.trackEvent("download",{productId:i.id}),Et(e,"fashionfit.jpg")}},"Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"Przymierz inne")))}async function Jt(){st("default");let e=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),o=t("canvas",{class:"ff-canvas"}),l=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),c=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");l.addEventListener("input",()=>{z&&z.setScale(parseFloat(l.value))}),I(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),c,e,o,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),l,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:p},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107"))),n.trackEvent("tryon_start",{productId:i.id,metadata:{mode:"ar",size:L}});try{z=await Ot({video:e,canvas:o,garmentUrl:i.garment_image_url}),c.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{Qt()}function p(){if(!z)return;let u=z.capture();J(),zt(u)}}function Qt(){J(),I(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:dt},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:B},"\u2190 Wr\xF3\u0107")))}async function te(){if(n.trackEvent("add_to_cart",{productId:i.id,metadata:{size:L}}),!a){i.product_url&&(window.location=i.product_url);return}try{let e=new FormData;e.append("product_id",a),e.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:e}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),it()}catch{window.location=`${location.pathname}?add-to-cart=${a}`}}return{mount:Ft,open:Z,close:it}}var he=document.currentScript;async function Ut(){let r=_t(he);if(!r.apiKey||!r.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}let n=St(),i=n?jt():null;Pt(r.primaryColor);let a=Mt(r),s=null;if(n&&i)try{let{products:d}=await a.getProducts(),m=d||[];if(s=m.find(b=>String(b.external_id)===String(i))||null,!s){let b=location.pathname.replace(/\/+$/,"");s=m.find(S=>{if(!S.product_url)return!1;try{return new URL(S.product_url).pathname.replace(/\/+$/,"")===b}catch{return!1}})||null}if(!s){let b=et(),S=w=>String(w||"").trim().toLowerCase();s=m.find(w=>S(w.name)===S(b.name))||null}}catch(d){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",d.message)}if(!s)if(n){let d=et();s={id:i||`fallback:${location.pathname}`,external_id:i||null,name:d.name||"Produkt",garment_image_url:d.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",i)}else s={id:`global:${location.pathname||"/"}`,external_id:null,name:"Lume \xB7 stylista AI",garment_image_url:null,product_url:null,category:null,variants:null,_fallback:!0};if(n&&String(s.category||"").toLowerCase()==="accessories"){console.info("[FashionFit] Pomijam widget try-on dla kategorii accessories.");return}Rt({config:r,api:a,product:s,externalId:i}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ut):Ut();})();
