(()=>{function t(r,o={},...s){let e=document.createElement(r);for(let[i,f]of Object.entries(o||{}))f!=null&&(i==="class"?e.className=f:i==="html"?e.innerHTML=f:i==="style"&&typeof f=="object"?Object.assign(e.style,f):i.startsWith("on")&&typeof f=="function"?e.addEventListener(i.slice(2).toLowerCase(),f):e.setAttribute(i,f));for(let i of s.flat())i==null||i===!1||e.appendChild(typeof i=="string"?document.createTextNode(i):i);return e}function V(r){let o=window.FashionFitConfig||{},s=r||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),e=s&&s.dataset||{};return{apiKey:o.apiKey||e.fashionfitKey||null,shopId:o.shopId||e.fashionfitShop||null,apiUrl:(o.apiUrl||e.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:o.primaryColor||e.fashionfitColor||"#C4883A",buttonLabel:o.buttonLabel||e.fashionfitLabel||"Przymierz wirtualnie \u2728",tryonProvider:o.tryonProvider||e.fashionfitProvider||"auto"}}function Q(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function tt(){let r=document.body.className.match(/postid-(\d+)/);if(r)return r[1];let o=document.querySelector('[id^="product-"]');if(o&&o.id){let i=o.id.match(/^product-(\d+)$/);if(i)return i[1]}let s=document.querySelector('meta[property="product:retailer_item_id"]');if(s&&s.getAttribute("content"))return s.getAttribute("content");let e=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return e?e.getAttribute("data-product_id")||e.getAttribute("value"):null}var wt=["image/jpeg","image/png"],kt=10*1024*1024;function et(r){return r?wt.includes(r.type)?r.size>kt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function ot(r){return new Promise((o,s)=>{let e=new FileReader;e.onload=()=>o(e.result),e.onerror=()=>s(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),e.readAsDataURL(r)})}function at(r){return new Promise((o,s)=>{let e=new Image;e.onload=()=>{let i=Number(e.naturalWidth||e.width||0),f=Number(e.naturalHeight||e.height||0),p=i>0&&f>0?Number((i*f/1e6).toFixed(2)):0,d="unknown";p>=4.5?d="ultra":p>=2?d="high":p>=.9?d="medium":p>0&&(d="low"),o({image_width:i,image_height:f,image_megapixels:p,image_quality_bucket:d,output_quality:"max"})},e.onerror=()=>s(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 rozdzielczo\u015Bci zdj\u0119cia")),e.src=r})}async function rt(r,o){try{let e=await(await fetch(r)).blob(),i=URL.createObjectURL(e),f=t("a",{href:i,download:o});document.body.appendChild(f),f.click(),f.remove(),URL.revokeObjectURL(i)}catch{window.open(r,"_blank")}}function F(){let r=document.querySelector(".product_title, h1.entry-title, h1"),o=document.querySelector('meta[property="og:title"]'),s=document.querySelector('meta[property="og:image"]'),e=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:r&&r.textContent.trim()||o&&o.content||"Produkt",image:e&&(e.currentSrc||e.src)||s&&s.content||null}}var zt=`
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
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
  letter-spacing: normal !important;
}

.ff-fab {
  position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 99999 !important;
  display: inline-flex !important; align-items: center !important; gap: 8px !important;
  padding: 14px 22px !important; border: 1px solid rgba(255,255,255,.12) !important; border-radius: 999px !important; cursor: pointer !important;
  background: linear-gradient(155deg, #101010 0%, #000 100%) !important; color: #fff !important;
  font: 700 14px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
  box-shadow: 0 16px 34px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12) !important;
  letter-spacing: .01em !important;
  animation: ff-slide-up .35s ease both;
}
.ff-fab:hover { transform: translateY(-2px); }

.ff-overlay {
  position: fixed; inset: 0; z-index: 100000;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 50% 20%, rgba(34,34,34,.34), rgba(8,8,8,.72));
  backdrop-filter: blur(8px);
  opacity: 0; transition: opacity .2s ease;
  font: 400 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ff-overlay.ff-open { opacity: 1; }

.ff-modal {
  position: relative; width: min(670px, 94vw); max-height: 92vh; overflow-y: auto;
  background: linear-gradient(180deg, #fff 0%, #fcfcfc 100%); color: #111827; border-radius: 26px; padding: 30px;
  border: 1px solid #ececee;
  box-shadow: 0 30px 90px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.92);
  transform: translateY(12px); transition: transform .25s ease;
}
.ff-modal::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 26px;
  pointer-events: none;
  background: radial-gradient(600px 260px at 100% -10%, rgba(0,0,0,.035), transparent 62%);
}
.ff-overlay.ff-open .ff-modal { transform: translateY(0); animation: ff-fade-in .25s ease both; }

.ff-close {
  position: absolute; top: 20px; right: 20px; width: 44px; height: 44px;
  border: 1px solid #ececee; border-radius: 999px; cursor: pointer; background: #f5f5f6;
  font-size: 34px !important; font-weight: 300 !important; line-height: 0.7 !important; color: #6f7682;
}
.ff-close:hover { background: #ececef; color: #14181f; }

.ff-h {
  margin: 0 0 18px;
  padding-right: 64px;
  color: #0b0c0f !important;
  font-size: 42px !important;
  font-weight: 800 !important;
  letter-spacing: -.02em !important;
  line-height: 1.06 !important;
}
.ff-sub { margin: 0 0 12px; color: #687181; font-size: 13px; font-weight: 600; letter-spacing: .01em; }

.ff-product { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ff-product img {
  width: 78px !important; height: 78px !important; object-fit: cover; border-radius: 14px;
  background: #f3f4f6; border: 1px solid #e7e8ea;
}
.ff-product b {
  font-size: 18px !important;
  line-height: 1.3 !important;
  color: #171b23 !important;
  font-weight: 700 !important;
}

.ff-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
.ff-mode {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  min-height: 138px;
  padding: 18px 16px; border: 1px solid #e6e8ec; border-radius: 20px; cursor: pointer;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%) !important; color: #111827 !important; font-weight: 600; text-align: center;
  line-height: 1.2;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.92);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ff-mode:hover {
  transform: translateY(-1px);
  border-color: #101114 !important;
  box-shadow: 0 10px 24px rgba(16,17,20,.14), inset 0 1px 0 rgba(255,255,255,.95);
  color: #111827 !important;
}
.ff-mode .ff-emoji {
  display: block !important;
  position: static !important;
  margin: 0 !important;
  transform: none !important;
  float: none !important;
  line-height: 1 !important;
  font-size: 28px !important;
  width: 50px !important;
  height: 50px !important;
  border-radius: 999px !important;
  background: #0f1115 !important;
  color: #fff !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 8px 20px rgba(0,0,0,.24) !important;
}
.ff-mode .ff-mode-label {
  display: block !important;
  position: static !important;
  margin: 0 !important;
  transform: none !important;
  float: none !important;
  font-size: 16px !important;
  line-height: 1.2 !important;
  font-weight: 800 !important;
  color: #111827 !important;
  text-transform: none !important;
}
.ff-mode:hover .ff-mode-label,
.ff-mode:focus-visible .ff-mode-label {
  color: #111827 !important;
}
.ff-badge {
  position: absolute; top: 10px; right: 10px; padding: 4px 10px; border-radius: 999px;
  background: #0a0a0a; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: .03em;
  z-index: 2;
}

.ff-sizes { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0 20px; }
.ff-size {
  min-width: 70px;
  padding: 13px 15px;
  border: 1px solid #d9dde3;
  border-radius: 16px;
  background: #fff;
  color: #111827;
  cursor: pointer;
  font-weight: 800;
  font-size: 18px;
  line-height: 1;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.95);
}
.ff-size.ff-active {
  border-color: #050505;
  background: linear-gradient(180deg, #171717 0%, #000 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(0,0,0,.22);
}

.ff-privacy {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 13px;
  padding: 10px 14px;
  border: 1px solid #eceef1;
  border-radius: 999px;
  background: #fafafb;
}

.ff-upload-wrap {
  border-radius: 16px;
}
.ff-drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 36px 16px; border: 2px dashed #d1d5db; border-radius: 14px; cursor: pointer;
  color: #6b7280; text-align: center; transition: border-color .15s ease;
}
.ff-drop.ff-over { border-color: var(--ff-primary); background: rgba(0,0,0,.02); }

.ff-upload-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: linear-gradient(180deg, #fcfcfd 0%, #f6f7f9 100%);
  padding: 12px;
  margin-top: 6px;
}
.ff-preview { width: 100%; border-radius: 14px; margin: 8px 0; display: block; }
.ff-upload-meta {
  color: #4b5563;
  font-size: 12px;
  line-height: 1.45;
  margin: 2px 0 10px;
}

.ff-result-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ff-result-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.ff-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .02em;
}
.ff-result-stage {
  margin-top: 8px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #f7f7f8 0%, #f1f2f4 100%);
}
.ff-result {
  width: 100%;
  max-height: 64vh;
  object-fit: contain;
  display: block;
  background: #f3f4f6;
}
.ff-result-note {
  margin-top: 12px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #eceef2;
  background: #fafbfc;
  border-radius: 12px;
  padding: 10px 12px;
}

.ff-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
  padding: 14px 18px; border: none; border-radius: 14px; cursor: pointer;
  background: linear-gradient(155deg, #121212 0%, #000 100%);
  color: #fff; font-weight: 700; font-size: 15px;
}
.ff-btn:hover { filter: brightness(1.06); }
.ff-btn[disabled] { opacity: .5; cursor: not-allowed; }
.ff-btn-ghost {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e3e5e9;
}

.ff-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; }

.ff-loading { text-align: center; padding: 18px 0; }
.ff-steps {
  margin: 10px auto 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  text-align: left;
}
.ff-step {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 7px 9px;
  font-size: 12px;
  color: #6b7280;
  background: #fafafa;
}
.ff-step-active {
  border-color: #0f1115;
  background: #f3f4f6;
  color: #111827;
  font-weight: 700;
}
.ff-step-done {
  border-color: #c7ced8;
  color: #1f2937;
  background: #f8fbf8;
}
.ff-spinner {
  width: 42px; height: 42px; margin: 0 auto 14px; border-radius: 50%;
  border: 4px solid #e5e7eb; border-top-color: var(--ff-primary);
  animation: ff-spin 1s linear infinite;
}
.ff-progress { height: 8px; border-radius: 999px; background: #e5e7eb; overflow: hidden; margin-top: 12px; }
.ff-progress > span { display: block; height: 100%; width: 0; background: var(--ff-primary); transition: width .3s ease; }

.ff-video { width: 100%; border-radius: 14px; display: none; }
.ff-canvas { width: 100%; border-radius: 14px; background: #111827; display: block; }
.ff-slider { width: 100%; margin: 14px 0; accent-color: var(--ff-primary); }
.ff-error { color: #b91c1c; font-size: 13px; margin: 8px 0; }

.ff-advisor-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 4px;
}
.ff-advisor-locked {
  border: 1px solid #f0d7d7;
  background: #fff8f8;
  border-radius: 14px;
  padding: 14px;
  color: #7f1d1d;
  line-height: 1.45;
}
.ff-chat-list {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fafbfc;
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
  line-height: 1.4;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
}
.ff-chat-user .ff-chat-bubble {
  border-color: #111827;
  background: #111827;
  color: #fff;
}
.ff-chat-bubble-loading {
  color: #4b5563;
  background: #f3f4f6;
}
.ff-advisor-input-wrap {
  margin-top: 10px;
}
.ff-advisor-input {
  width: 100%;
  resize: vertical;
  min-height: 82px;
  border: 1px solid #d7dbe2;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: #111827;
  background: #fff;
}
.ff-advisor-input:disabled {
  background: #f3f4f6;
  color: #6b7280;
}
.ff-advisor-empty {
  border: 1px dashed #d4d9e1;
  border-radius: 12px;
  padding: 12px;
  color: #4b5563;
  font-size: 13px;
  background: #fff;
}
.ff-advisor-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;
}
.ff-advisor-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}
.ff-advisor-card-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
}
.ff-advisor-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ff-advisor-card-name {
  color: #111827 !important;
  font-size: 14px !important;
  line-height: 1.35 !important;
}
.ff-advisor-card-category {
  color: #6b7280;
  font-size: 12px;
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

@keyframes ff-spin { to { transform: rotate(360deg); } }
@keyframes ff-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ff-slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 600px) {
  .ff-modal { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; padding: 22px 18px; }
  .ff-overlay { align-items: stretch; }
  .ff-h { font-size: 33px !important; }
  .ff-mode { min-height: 124px; border-radius: 16px; }
  .ff-mode .ff-mode-label { font-size: 19px !important; }
  .ff-size {
    min-width: 60px;
    padding: 11px 12px;
    border-radius: 14px;
    font-size: 15px;
  }
  .ff-privacy { font-size: 13px; }
  .ff-result {
    max-height: 54vh;
  }
  .ff-steps {
    grid-template-columns: 1fr;
  }
}
`;function nt(r){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",r);let o=document.createElement("style");o.id="ff-styles",o.textContent=zt,document.head.appendChild(o)}function it(r){let o={"X-API-Key":r.apiKey,"Content-Type":"application/json"};async function s(e,i={}){let f=await fetch(r.apiUrl+e,{headers:o,...i}),p=await f.json().catch(()=>({}));if(!f.ok){let d=new Error(p.error||p.message||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${f.status})`);throw d.status=f.status,d.code=p.code||null,d.payload=p,d}return p}return{getProducts(){return s(`/api/widget/products/${r.shopId}`)},startPhotoTryon(e,i,f){return s("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:r.shopId,productId:e,personImageBase64:i,preferredProvider:r.tryonProvider||"auto",metadata:{...f||{},preferredProvider:r.tryonProvider||"auto"}})})},getTryonStatus(e){return s(`/api/widget/tryon/status/${e}`)},getModules(){return s(`/api/widget/modules/${r.shopId}`)},advisorChat(e,i=null){let f={shopId:r.shopId,message:e};return i&&(f.conversationId=i),s("/api/widget/advisor/chat",{method:"POST",body:JSON.stringify(f)})},trackEvent(e,i={}){return s("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:r.shopId,eventType:e,...i})}).catch(()=>{})}}}var jt="0.10.14",st=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${jt}`,St=`${st}/wasm`,It="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",K;function _t(){return K||(K=new Function("u","return import(u)")(st)),K}async function ft({video:r,canvas:o,garmentUrl:s}){let e=o.getContext("2d"),i=null,f=null,p=null,d=!1,k=1,h=new Image;h.crossOrigin="anonymous",s&&(h.src=s);let _=await _t(),O=await _.FilesetResolver.forVisionTasks(St);f=await _.PoseLandmarker.createFromOptions(O,{baseOptions:{modelAssetPath:It,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),i=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),r.srcObject=i,await r.play(),o.width=r.videoWidth||640,o.height=r.videoHeight||480,d=!0,P();function P(){if(d){if(e.drawImage(r,0,0,o.width,o.height),f&&r.readyState>=2)try{let b=f.detectForVideo(r,performance.now()),S=b.landmarks&&b.landmarks[0];S&&E(S)}catch{}p=requestAnimationFrame(P)}}function E(b){if(!h.complete||!h.naturalWidth)return;let S=b[12],L=b[11];if(!S||!L)return;let A=o.width,y=o.height,I=S.x*A,C=S.y*y,R=L.x*A,N=L.y*y,M=Math.hypot(R-I,N-C)*1.8*k,U=h.naturalHeight/h.naturalWidth,x=M*U,D=(I+R)/2,z=(C+N)/2-x*.15;e.save(),e.globalAlpha=.92,e.drawImage(h,D-M/2,z,M,x),e.restore()}function j(){if(d=!1,p&&cancelAnimationFrame(p),i&&i.getTracks().forEach(b=>b.stop()),f&&f.close)try{f.close()}catch{}}return{setScale(b){k=b},capture(){return o.toDataURL("image/jpeg",.92)},stop:j}}var Pt=["XS","S","M","L","XL","XXL"],Lt=3e3,At=20;function dt({config:r,api:o,product:s,externalId:e}){let i=F(),f=s.name||i.name,p=s.garment_image_url||i.image,d=null,k=null,h=null,_="M",O=null,P=[],E="",j=!1,b="",S="",L=!1,A=!1,y=null,I="",C=!1,R=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:$},r.buttonLabel);function N(){document.body.appendChild(R)}function $(){d&&d.remove(),O=null,P=[],E="",j=!1,b="",S="",L=!1,A=!1,y=null,I="",C=!1,k=t("div",{class:"ff-modal-body"}),d=t("div",{class:"ff-overlay",onclick:a=>{a.target===d&&M()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:M},"\xD7"),k)),document.body.appendChild(d),requestAnimationFrame(()=>d.classList.add("ff-open")),z(),o.trackEvent("widget_open",{productId:s.id})}function M(){if(o.trackEvent("close",{productId:s.id}),U(),d){let a=d;a.classList.remove("ff-open"),setTimeout(()=>a.remove(),200),d=null}}function U(){h&&(h.stop(),h=null)}function x(...a){k.innerHTML="",a.forEach(n=>k.appendChild(n))}function D(){return t("div",{class:"ff-product"},p?t("img",{src:p,alt:f}):null,t("b",{},f))}function z(){U();let a=t("div",{class:"ff-sizes"},...Pt.map(n=>{let c=t("button",{class:`ff-size${n===_?" ff-active":""}`,type:"button",onclick:()=>{_=n,a.querySelectorAll(".ff-size").forEach(l=>l.classList.remove("ff-active")),c.classList.add("ff-active")}},n);return c}));x(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),D(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:q},t("span",{class:"ff-emoji"},"\u{1F4F8}"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:bt},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u{1F4F9}"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki")),t("button",{class:"ff-mode",type:"button",onclick:T},t("span",{class:"ff-emoji"},"\u2728"),t("span",{class:"ff-mode-label"},"AI Stylist"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),a,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function ct(a){let c=(Array.isArray(a&&a.modules)?a.modules:[]).find(l=>l&&l.key==="ai_stylist_advisor");return!!(c&&c.enabled)}function pt(a){if(!a)return null;try{let n=new URL(String(a));return n.protocol==="http:"||n.protocol==="https:"?n.toString():null}catch{return null}}async function ut(){if(!C){C=!0,I="",y=null;try{let a=await o.getModules();L=!0,A=ct(a),A||(y={code:"MODULE_LOCKED",message:"Advisor module is locked for this shop",upgrade:{requiredModule:"ai_stylist_advisor",action:"upgrade_plan"}})}catch(a){I=a&&a.message?a.message:"Nie uda\u0142o si\u0119 sprawdzi\u0107 dost\u0119pno\u015Bci modu\u0142u."}finally{C=!1,d&&T()}}}function mt(a){return!Array.isArray(a)||a.length===0?t("div",{class:"ff-advisor-empty"},"Brak dopasowanych produkt\xF3w dla tej wiadomo\u015Bci."):t("div",{class:"ff-advisor-cards"},...a.slice(0,3).map(n=>{let c=pt(n&&n.productUrl);return t("div",{class:"ff-advisor-card"},n&&n.garmentImageUrl?t("img",{class:"ff-advisor-card-image",src:n.garmentImageUrl,alt:n.name||"Produkt"}):null,t("div",{class:"ff-advisor-card-body"},t("b",{class:"ff-advisor-card-name"},n&&n.name?n.name:"Produkt"),n&&n.category?t("div",{class:"ff-advisor-card-category"},n.category):null,c?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-card-cta",type:"button",onclick:()=>window.open(c,"_blank","noopener,noreferrer")},"Zobacz produkt"):null))}))}function T(){if(U(),!L&&!I&&!y){x(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-loading"},t("div",{class:"ff-spinner"}),t("div",{class:"ff-sub"},"Sprawdzam dost\u0119pno\u015B\u0107 modu\u0142u...")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107"))),ut();return}if(I){x(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-error"},I),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{I="",L=!1,y=null,T()}},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")));return}if(!A||y){let l=y&&(y.message||y.error)||"Advisor module is locked for this shop";x(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),t("div",{class:"ff-advisor-locked"},t("b",{},"Modu\u0142 niedost\u0119pny"),t("div",{},l),t("div",{class:"ff-sub"},"Aby odblokowa\u0107 ten modu\u0142, przejd\u017A na wy\u017Cszy plan.")),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>{L=!1,A=!1,y=null,I="",T()}},"Sprawd\u017A ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")));return}async function a(l,m={}){let{retry:g=!1}=m;if(j)return;let w=String(l||"").trim();if(w){j=!0,b="",S=w,g||(P=P.concat([{role:"user",text:w}]),E=""),T();try{let u=await o.advisorChat(w,O);u&&u.conversationId&&(O=u.conversationId),P=P.concat([{role:"assistant",text:u&&u.reply?u.reply:"Oto rekomendacje z Twojego katalogu.",recommendations:Array.isArray(u&&u.recommendations)?u.recommendations.slice(0,3):[]}])}catch(u){u&&u.code==="MODULE_LOCKED"?(y=u.payload||{code:"MODULE_LOCKED",message:u.message||"Advisor module is locked for this shop"},A=!1):b=u&&u.message?u.message:"Nie uda\u0142o si\u0119 wys\u0142a\u0107 wiadomo\u015Bci."}finally{j=!1,d&&T()}}}let n=P.length>0?P.map(l=>t("div",{class:`ff-chat-row ff-chat-${l.role==="user"?"user":"assistant"}`},t("div",{class:"ff-chat-bubble"},l.text||""),l.role==="assistant"?mt(l.recommendations||[]):null)):[t("div",{class:"ff-advisor-empty"},"Napisz, czego szukasz, a AI Stylist podpowie produkty z katalogu tego sklepu.")];j&&n.push(t("div",{class:"ff-chat-row ff-chat-assistant"},t("div",{class:"ff-chat-bubble ff-chat-bubble-loading"},"Przygotowuj\u0119 propozycje...")));let c=t("textarea",{class:"ff-advisor-input",rows:"3",maxlength:"1000",placeholder:"Np. Szukam letniej sukienki na wesele",value:E,oninput:l=>{E=l.target.value||"",b&&(b="",T())}});j&&c.setAttribute("disabled","true"),x(t("h2",{class:"ff-h"},"\u2728 AI Stylist"),D(),t("div",{class:"ff-chat-list"},n),b?t("div",{class:"ff-error ff-advisor-inline-error"},b,S?t("button",{class:"ff-btn ff-btn-ghost ff-advisor-retry",type:"button",onclick:()=>a(S,{retry:!0}),disabled:j?"true":null},"Spr\xF3buj ponownie"):null):null,t("div",{class:"ff-advisor-input-wrap"},c),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:()=>a(E),disabled:j||!E.trim()?"true":null},j?"Wysy\u0142anie...":"Wy\u015Blij"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function q(){let a=null,n=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),l=t("div",{class:"ff-error",style:{display:"none"}}),m=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>vt()},"Przymierz"),g=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB")),w=t("div",{class:"ff-upload-wrap"},g),u=t("img",{class:"ff-preview",alt:"Podgl\u0105d zdj\u0119cia"}),X=t("div",{class:"ff-upload-meta"}),xt=t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>c.click()},"Zmie\u0144 zdj\u0119cie"),G=t("div",{class:"ff-upload-card",style:{display:"none"}},u,X,xt);function J(v){l.textContent=v,l.style.display=v?"block":"none"}async function Z(v){let W=et(v);if(W){J(W);return}J(""),a=await ot(v);try{n=await at(a)}catch{n={output_quality:"max"}}u.src=a,X.textContent=n&&n.image_width&&n.image_height?`Rozdzielczo\u015B\u0107: ${n.image_width}\xD7${n.image_height} \xB7 ${n.image_megapixels} MP \xB7 jako\u015B\u0107 wej\u015Bciowa: ${n.image_quality_bucket}`:"Jako\u015B\u0107 wej\u015Bciowa: automatycznie wykryta",g.style.display="none",G.style.display="block",m.removeAttribute("disabled")}g.addEventListener("click",()=>c.click()),g.addEventListener("dragover",v=>{v.preventDefault(),g.classList.add("ff-over")}),g.addEventListener("dragleave",()=>g.classList.remove("ff-over")),g.addEventListener("drop",v=>{v.preventDefault(),g.classList.remove("ff-over"),v.dataTransfer.files[0]&&Z(v.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&Z(c.files[0])});async function vt(){if(!a)return;let v={mode:"photo",size:_,output_quality:"max",...n||{}};o.trackEvent("tryon_start",{productId:s.id,metadata:v}),Y();try{let{sessionId:W}=await o.startPhotoTryon(s.id,a,v);gt(W)}catch(W){B(W.message)}}x(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),w,G,c,l,t("div",{class:"ff-actions"},m,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function Y(){let a=t("span",{}),n=[t("div",{class:"ff-step ff-step-active"},"1. Analiza zdj\u0119cia"),t("div",{class:"ff-step"},"2. Dopasowanie produktu"),t("div",{class:"ff-step"},"3. Render HD"),t("div",{class:"ff-step"},"4. Finalizacja")],c=t("div",{class:"ff-steps"},n);x(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"Zachowujemy najwy\u017Csz\u0105 jako\u015B\u0107 finalnego zdj\u0119cia"),c,t("div",{class:"ff-progress"},a)));let l=5,m=0,g=setInterval(()=>{l=Math.min(90,l+6),a.style.width=`${l}%`,l>=25&&m<1&&(m=1),l>=55&&m<2&&(m=2),l>=80&&m<3&&(m=3),n.forEach((w,u)=>{w.classList.remove("ff-step-done","ff-step-active"),u<m&&w.classList.add("ff-step-done"),u===m&&w.classList.add("ff-step-active")}),d||clearInterval(g)},700);return()=>{clearInterval(g),a.style.width="100%",n.forEach(w=>{w.classList.remove("ff-step-active"),w.classList.add("ff-step-done")})}}function gt(a){let n=0,c=Y(),l=setInterval(async()=>{if(n+=1,!d){clearInterval(l);return}try{let{status:m,resultImageUrl:g}=await o.getTryonStatus(a);m==="completed"&&g?(clearInterval(l),c(),H(g)):(m==="failed"||n>=At)&&(clearInterval(l),B("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(m){clearInterval(l),B(m.message)}},Lt)}function B(a){x(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},a),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:q},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}function H(a){o.trackEvent("tryon_complete",{productId:s.id,metadata:{size:_,output_quality:"max"}}),x(t("div",{class:"ff-result-head"},t("h2",{class:"ff-h"},"Twoja przymiarka"),t("div",{class:"ff-result-pills"},t("span",{class:"ff-pill"},`Rozmiar ${_}`),t("span",{class:"ff-pill"},"MAX QUALITY"))),t("div",{class:"ff-result-stage"},t("img",{class:"ff-result",src:a,alt:"Wynik przymiarki"})),t("div",{class:"ff-result-note"},"Wskaz\xF3wka: najlepiej dzia\u0142a zdj\u0119cie samego ubrania bez torebki i dodatk\xF3w."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:yt},"Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>window.open(a,"_blank","noopener,noreferrer")},"Otw\xF3rz pe\u0142ny podgl\u0105d"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{o.trackEvent("download",{productId:s.id}),rt(a,"fashionfit.jpg")}},"Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"Przymierz inne")))}async function bt(){let a=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),n=t("canvas",{class:"ff-canvas"}),c=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),l=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");c.addEventListener("input",()=>{h&&h.setScale(parseFloat(c.value))}),x(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),l,a,n,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),c,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:m},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107"))),o.trackEvent("tryon_start",{productId:s.id,metadata:{mode:"ar",size:_}});try{h=await ft({video:a,canvas:n,garmentUrl:s.garment_image_url}),l.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{ht()}function m(){if(!h)return;let g=h.capture();U(),H(g)}}function ht(){U(),x(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:q},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:z},"\u2190 Wr\xF3\u0107")))}async function yt(){if(o.trackEvent("add_to_cart",{productId:s.id,metadata:{size:_}}),!e){s.product_url&&(window.location=s.product_url);return}try{let a=new FormData;a.append("product_id",e),a.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:a}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),M()}catch{window.location=`${location.pathname}?add-to-cart=${e}`}}return{mount:N,open:$,close:M}}var Et=document.currentScript;async function lt(){let r=V(Et);if(!r.apiKey||!r.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!Q())return;let o=tt();nt(r.primaryColor);let s=it(r),e=null;if(o)try{let{products:i}=await s.getProducts(),f=i||[];if(e=f.find(p=>String(p.external_id)===String(o))||null,!e){let p=location.pathname.replace(/\/+$/,"");e=f.find(d=>{if(!d.product_url)return!1;try{return new URL(d.product_url).pathname.replace(/\/+$/,"")===p}catch{return!1}})||null}if(!e){let p=F(),d=k=>String(k||"").trim().toLowerCase();e=f.find(k=>d(k.name)===d(p.name))||null}}catch(i){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",i.message)}if(!e){let i=F();e={id:o||`fallback:${location.pathname}`,external_id:o||null,name:i.name||"Produkt",garment_image_url:i.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",o)}if(String(e.category||"").toLowerCase()==="accessories"){console.info("[FashionFit] Pomijam widget try-on dla kategorii accessories.");return}dt({config:r,api:s,product:e,externalId:o}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",lt):lt();})();
