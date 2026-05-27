(()=>{function t(n,o={},...r){let e=document.createElement(n);for(let[a,s]of Object.entries(o||{}))s!=null&&(a==="class"?e.className=s:a==="html"?e.innerHTML=s:a==="style"&&typeof s=="object"?Object.assign(e.style,s):a.startsWith("on")&&typeof s=="function"?e.addEventListener(a.slice(2).toLowerCase(),s):e.setAttribute(a,s));for(let a of r.flat())a==null||a===!1||e.appendChild(typeof a=="string"?document.createTextNode(a):a);return e}function N(n){let o=window.FashionFitConfig||{},r=n||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),e=r&&r.dataset||{};return{apiKey:o.apiKey||e.fashionfitKey||null,shopId:o.shopId||e.fashionfitShop||null,apiUrl:(o.apiUrl||e.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:o.primaryColor||e.fashionfitColor||"#C4883A",buttonLabel:o.buttonLabel||e.fashionfitLabel||"Przymierz wirtualnie \u2728"}}function D(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function $(){let n=document.body.className.match(/postid-(\d+)/);if(n)return n[1];let o=document.querySelector('[id^="product-"]');if(o&&o.id){let a=o.id.match(/^product-(\d+)$/);if(a)return a[1]}let r=document.querySelector('meta[property="product:retailer_item_id"]');if(r&&r.getAttribute("content"))return r.getAttribute("content");let e=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return e?e.getAttribute("data-product_id")||e.getAttribute("value"):null}var Q=["image/jpeg","image/png"],tt=10*1024*1024;function q(n){return n?Q.includes(n.type)?n.size>tt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function B(n){return new Promise((o,r)=>{let e=new FileReader;e.onload=()=>o(e.result),e.onerror=()=>r(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),e.readAsDataURL(n)})}async function Y(n,o){try{let e=await(await fetch(n)).blob(),a=URL.createObjectURL(e),s=t("a",{href:a,download:o});document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(a)}catch{window.open(n,"_blank")}}function _(){let n=document.querySelector(".product_title, h1.entry-title, h1"),o=document.querySelector('meta[property="og:title"]'),r=document.querySelector('meta[property="og:image"]'),e=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:n&&n.textContent.trim()||o&&o.content||"Produkt",image:e&&(e.currentSrc||e.src)||r&&r.content||null}}var et=`
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
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%); color: #111827; font-weight: 600; text-align: center;
  line-height: 1.2;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.92);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ff-mode:hover {
  transform: translateY(-1px);
  border-color: #101114;
  box-shadow: 0 10px 24px rgba(16,17,20,.14), inset 0 1px 0 rgba(255,255,255,.95);
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
  color: inherit !important;
  text-transform: none !important;
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

.ff-drop {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 36px 16px; border: 2px dashed #d1d5db; border-radius: 14px; cursor: pointer;
  color: #6b7280; text-align: center; transition: border-color .15s ease;
}
.ff-drop.ff-over { border-color: var(--ff-primary); background: rgba(0,0,0,.02); }

.ff-preview { width: 100%; border-radius: 14px; margin: 8px 0; display: block; }
.ff-result { width: 100%; border-radius: 14px; display: block; background: #f3f4f6; }

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
}
`;function H(n){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",n);let o=document.createElement("style");o.id="ff-styles",o.textContent=et,document.head.appendChild(o)}function K(n){let o={"X-API-Key":n.apiKey,"Content-Type":"application/json"};async function r(e,a={}){let s=await fetch(n.apiUrl+e,{headers:o,...a}),u=await s.json().catch(()=>({}));if(!s.ok)throw new Error(u.error||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${s.status})`);return u}return{getProducts(){return r(`/api/widget/products/${n.shopId}`)},startPhotoTryon(e,a,s){return r("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:n.shopId,productId:e,personImageBase64:a,metadata:s})})},getTryonStatus(e){return r(`/api/widget/tryon/status/${e}`)},trackEvent(e,a={}){return r("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:n.shopId,eventType:e,...a})}).catch(()=>{})}}}var ot="0.10.14",X=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ot}`,nt=`${X}/wasm`,rt="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",F;function at(){return F||(F=new Function("u","return import(u)")(X)),F}async function G({video:n,canvas:o,garmentUrl:r}){let e=o.getContext("2d"),a=null,s=null,u=null,f=!1,h=1,d=new Image;d.crossOrigin="anonymous",r&&(d.src=r);let x=await at(),C=await x.FilesetResolver.forVisionTasks(nt);s=await x.PoseLandmarker.createFromOptions(C,{baseOptions:{modelAssetPath:rt,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),a=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),n.srcObject=a,await n.play(),o.width=n.videoWidth||640,o.height=n.videoHeight||480,f=!0,E();function E(){if(f){if(e.drawImage(n,0,0,o.width,o.height),s&&n.readyState>=2)try{let p=s.detectForVideo(n,performance.now()),g=p.landmarks&&p.landmarks[0];g&&T(g)}catch{}u=requestAnimationFrame(E)}}function T(p){if(!d.complete||!d.naturalWidth)return;let g=p[12],j=p[11];if(!g||!j)return;let v=o.width,z=o.height,I=g.x*v,A=g.y*z,S=j.x*v,L=j.y*z,P=Math.hypot(S-I,L-A)*1.8*h,U=d.naturalHeight/d.naturalWidth,i=P*U,c=(I+S)/2,l=(A+L)/2-i*.15;e.save(),e.globalAlpha=.92,e.drawImage(d,c-P/2,l,P,i),e.restore()}function k(){if(f=!1,u&&cancelAnimationFrame(u),a&&a.getTracks().forEach(p=>p.stop()),s&&s.close)try{s.close()}catch{}}return{setScale(p){h=p},capture(){return o.toDataURL("image/jpeg",.92)},stop:k}}var it=["XS","S","M","L","XL","XXL"],st=3e3,ct=20;function V({config:n,api:o,product:r,externalId:e}){let a=_(),s=r.name||a.name,u=r.garment_image_url||a.image,f=null,h=null,d=null,x="M",C=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:T},n.buttonLabel);function E(){document.body.appendChild(C)}function T(){f&&f.remove(),h=t("div",{class:"ff-modal-body"}),f=t("div",{class:"ff-overlay",onclick:i=>{i.target===f&&k()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:k},"\xD7"),h)),document.body.appendChild(f),requestAnimationFrame(()=>f.classList.add("ff-open")),v(),o.trackEvent("widget_open",{productId:r.id})}function k(){if(o.trackEvent("close",{productId:r.id}),p(),f){let i=f;i.classList.remove("ff-open"),setTimeout(()=>i.remove(),200),f=null}}function p(){d&&(d.stop(),d=null)}function g(...i){h.innerHTML="",i.forEach(c=>h.appendChild(c))}function j(){return t("div",{class:"ff-product"},u?t("img",{src:u,alt:s}):null,t("b",{},s))}function v(){p();let i=t("div",{class:"ff-sizes"},...it.map(c=>{let l=t("button",{class:`ff-size${c===x?" ff-active":""}`,type:"button",onclick:()=>{x=c,i.querySelectorAll(".ff-size").forEach(y=>y.classList.remove("ff-active")),l.classList.add("ff-active")}},c);return l}));g(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),j(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:z},t("span",{class:"ff-emoji"},"\u{1F4F8}"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:M},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u{1F4F9}"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),i,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function z(){let i=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),l=t("div",{class:"ff-error",style:{display:"none"}}),y=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>Z()},"Przymierz"),w=t("div",{}),b=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB"));function R(m){l.textContent=m,l.style.display=m?"block":"none"}async function W(m){let O=q(m);if(O){R(O);return}R(""),i=await B(m),w.innerHTML="",w.appendChild(t("img",{class:"ff-preview",src:i,alt:"Podgl\u0105d"})),y.removeAttribute("disabled")}b.addEventListener("click",()=>c.click()),b.addEventListener("dragover",m=>{m.preventDefault(),b.classList.add("ff-over")}),b.addEventListener("dragleave",()=>b.classList.remove("ff-over")),b.addEventListener("drop",m=>{m.preventDefault(),b.classList.remove("ff-over"),m.dataTransfer.files[0]&&W(m.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&W(c.files[0])});async function Z(){if(i){o.trackEvent("tryon_start",{productId:r.id,metadata:{mode:"photo",size:x}}),I();try{let{sessionId:m}=await o.startPhotoTryon(r.id,i,{size:x});A(m)}catch(m){S(m.message)}}}g(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),b,c,w,l,t("div",{class:"ff-actions"},y,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function I(){let i=t("span",{});g(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"To potrwa oko\u0142o 10 sekund"),t("div",{class:"ff-progress"},i)));let c=5,l=setInterval(()=>{c=Math.min(90,c+6),i.style.width=`${c}%`,f||clearInterval(l)},700);return()=>{clearInterval(l),i.style.width="100%"}}function A(i){let c=0,l=I(),y=setInterval(async()=>{if(c+=1,!f){clearInterval(y);return}try{let{status:w,resultImageUrl:b}=await o.getTryonStatus(i);w==="completed"&&b?(clearInterval(y),l(),L(b)):(w==="failed"||c>=ct)&&(clearInterval(y),S("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(w){clearInterval(y),S(w.message)}},st)}function S(i){g(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},i),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function L(i){o.trackEvent("tryon_complete",{productId:r.id,metadata:{size:x}}),g(t("h2",{class:"ff-h"},"Twoja przymiarka \u2728"),t("img",{class:"ff-result",src:i,alt:"Wynik przymiarki"}),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:U},"\u{1F6D2} Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{o.trackEvent("download",{productId:r.id}),Y(i,"fashionfit.jpg")}},"\u2B07\uFE0F Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u{1F501} Przymierz inne")))}async function M(){let i=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),c=t("canvas",{class:"ff-canvas"}),l=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),y=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");l.addEventListener("input",()=>{d&&d.setScale(parseFloat(l.value))}),g(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),y,i,c,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),l,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:w},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107"))),o.trackEvent("tryon_start",{productId:r.id,metadata:{mode:"ar",size:x}});try{d=await G({video:i,canvas:c,garmentUrl:r.garment_image_url}),y.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{P()}function w(){if(!d)return;let b=d.capture();p(),L(b)}}function P(){p(),g(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}async function U(){if(o.trackEvent("add_to_cart",{productId:r.id,metadata:{size:x}}),!e){r.product_url&&(window.location=r.product_url);return}try{let i=new FormData;i.append("product_id",e),i.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:i}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),k()}catch{window.location=`${location.pathname}?add-to-cart=${e}`}}return{mount:E,open:T,close:k}}var ft=document.currentScript;async function J(){let n=N(ft);if(!n.apiKey||!n.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!D())return;let o=$();H(n.primaryColor);let r=K(n),e=null;if(o)try{let{products:a}=await r.getProducts(),s=a||[];if(e=s.find(u=>String(u.external_id)===String(o))||null,!e){let u=location.pathname.replace(/\/+$/,"");e=s.find(f=>{if(!f.product_url)return!1;try{return new URL(f.product_url).pathname.replace(/\/+$/,"")===u}catch{return!1}})||null}if(!e){let u=_(),f=h=>String(h||"").trim().toLowerCase();e=s.find(h=>f(h.name)===f(u.name))||null}}catch(a){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",a.message)}if(!e){let a=_();e={id:o||`fallback:${location.pathname}`,external_id:o||null,name:a.name||"Produkt",garment_image_url:a.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",o)}V({config:n,api:r,product:e,externalId:o}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
