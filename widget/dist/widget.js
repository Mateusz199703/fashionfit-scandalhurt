(()=>{function t(r,o={},...n){let e=document.createElement(r);for(let[a,s]of Object.entries(o||{}))s!=null&&(a==="class"?e.className=s:a==="html"?e.innerHTML=s:a==="style"&&typeof s=="object"?Object.assign(e.style,s):a.startsWith("on")&&typeof s=="function"?e.addEventListener(a.slice(2).toLowerCase(),s):e.setAttribute(a,s));for(let a of n.flat())a==null||a===!1||e.appendChild(typeof a=="string"?document.createTextNode(a):a);return e}function N(r){let o=window.FashionFitConfig||{},n=r||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),e=n&&n.dataset||{};return{apiKey:o.apiKey||e.fashionfitKey||null,shopId:o.shopId||e.fashionfitShop||null,apiUrl:(o.apiUrl||e.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:o.primaryColor||e.fashionfitColor||"#C4883A",buttonLabel:o.buttonLabel||e.fashionfitLabel||"Przymierz wirtualnie \u2728"}}function D(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function $(){let r=document.body.className.match(/postid-(\d+)/);if(r)return r[1];let o=document.querySelector('[id^="product-"]');if(o&&o.id){let a=o.id.match(/^product-(\d+)$/);if(a)return a[1]}let n=document.querySelector('meta[property="product:retailer_item_id"]');if(n&&n.getAttribute("content"))return n.getAttribute("content");let e=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return e?e.getAttribute("data-product_id")||e.getAttribute("value"):null}var Q=["image/jpeg","image/png"],tt=10*1024*1024;function q(r){return r?Q.includes(r.type)?r.size>tt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function B(r){return new Promise((o,n)=>{let e=new FileReader;e.onload=()=>o(e.result),e.onerror=()=>n(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),e.readAsDataURL(r)})}async function H(r,o){try{let e=await(await fetch(r)).blob(),a=URL.createObjectURL(e),s=t("a",{href:a,download:o});document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(a)}catch{window.open(r,"_blank")}}function _(){let r=document.querySelector(".product_title, h1.entry-title, h1"),o=document.querySelector('meta[property="og:title"]'),n=document.querySelector('meta[property="og:image"]'),e=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:r&&r.textContent.trim()||o&&o.content||"Produkt",image:e&&(e.currentSrc||e.src)||n&&n.content||null}}var et=`
.ff-fab {
  position: fixed; bottom: 24px; right: 24px; z-index: 99999;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 20px; border: none; border-radius: 999px; cursor: pointer;
  background: var(--ff-primary); color: #fff;
  font: 600 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  box-shadow: 0 8px 24px rgba(0,0,0,.22);
  animation: ff-slide-up .35s ease both;
}
.ff-fab:hover { filter: brightness(1.06); transform: translateY(-1px); }

.ff-overlay {
  position: fixed; inset: 0; z-index: 100000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(17,24,39,.55); backdrop-filter: blur(2px);
  opacity: 0; transition: opacity .2s ease;
  font: 400 15px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ff-overlay.ff-open { opacity: 1; }

.ff-modal {
  position: relative; width: min(460px, 94vw); max-height: 92vh; overflow-y: auto;
  background: #fff; color: #111827; border-radius: 18px; padding: 24px;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
  transform: translateY(12px); transition: transform .25s ease;
}
.ff-overlay.ff-open .ff-modal { transform: translateY(0); animation: ff-fade-in .25s ease both; }

.ff-close {
  position: absolute; top: 12px; right: 14px; width: 32px; height: 32px;
  border: none; border-radius: 50%; cursor: pointer; background: #f3f4f6;
  font-size: 20px; line-height: 1; color: #6b7280;
}
.ff-close:hover { background: #e5e7eb; }

.ff-h { margin: 0 0 16px; font-size: 19px; font-weight: 700; }
.ff-sub { margin: 0 0 12px; color: #6b7280; font-size: 13px; }

.ff-product { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ff-product img { width: 56px; height: 56px; object-fit: cover; border-radius: 10px; background: #f3f4f6; }
.ff-product b { font-size: 15px; }

.ff-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; }
.ff-mode {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 12px; border: 1.5px solid #e5e7eb; border-radius: 14px; cursor: pointer;
  background: #fff; color: #111827; font-weight: 600; text-align: center;
}
.ff-mode:hover { border-color: var(--ff-primary); }
.ff-mode .ff-emoji { font-size: 26px; }
.ff-badge {
  position: absolute; top: -8px; right: -8px; padding: 2px 8px; border-radius: 999px;
  background: var(--ff-primary); color: #fff; font-size: 10px; font-weight: 700;
}

.ff-sizes { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 18px; }
.ff-size {
  min-width: 44px; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 10px;
  background: #fff; color: #111827; cursor: pointer; font-weight: 600;
}
.ff-size.ff-active { border-color: var(--ff-primary); background: var(--ff-primary); color: #fff; }

.ff-privacy { display: flex; align-items: center; gap: 8px; color: #6b7280; font-size: 12px; }

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
  padding: 13px 18px; border: none; border-radius: 12px; cursor: pointer;
  background: var(--ff-primary); color: #fff; font-weight: 700; font-size: 15px;
}
.ff-btn:hover { filter: brightness(1.06); }
.ff-btn[disabled] { opacity: .5; cursor: not-allowed; }
.ff-btn-ghost { background: #f3f4f6; color: #111827; }

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
  .ff-modal { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
  .ff-overlay { align-items: stretch; }
}

@media (prefers-color-scheme: dark) {
  .ff-modal { background: #1f2937; color: #f9fafb; }
  .ff-close { background: #374151; color: #d1d5db; }
  .ff-mode, .ff-size { background: #111827; color: #f9fafb; border-color: #374151; }
  .ff-btn-ghost { background: #374151; color: #f9fafb; }
  .ff-drop { border-color: #4b5563; color: #9ca3af; }
  .ff-progress, .ff-spinner { border-color: #374151; }
  .ff-product img, .ff-result { background: #374151; }
}
`;function K(r){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",r);let o=document.createElement("style");o.id="ff-styles",o.textContent=et,document.head.appendChild(o)}function X(r){let o={"X-API-Key":r.apiKey,"Content-Type":"application/json"};async function n(e,a={}){let s=await fetch(r.apiUrl+e,{headers:o,...a}),u=await s.json().catch(()=>({}));if(!s.ok)throw new Error(u.error||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${s.status})`);return u}return{getProducts(){return n(`/api/widget/products/${r.shopId}`)},startPhotoTryon(e,a,s){return n("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:r.shopId,productId:e,personImageBase64:a,metadata:s})})},getTryonStatus(e){return n(`/api/widget/tryon/status/${e}`)},trackEvent(e,a={}){return n("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:r.shopId,eventType:e,...a})}).catch(()=>{})}}}var ot="0.10.14",Y=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ot}`,rt=`${Y}/wasm`,nt="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",M;function at(){return M||(M=new Function("u","return import(u)")(Y)),M}async function G({video:r,canvas:o,garmentUrl:n}){let e=o.getContext("2d"),a=null,s=null,u=null,f=!1,y=1,d=new Image;d.crossOrigin="anonymous",n&&(d.src=n);let x=await at(),C=await x.FilesetResolver.forVisionTasks(rt);s=await x.PoseLandmarker.createFromOptions(C,{baseOptions:{modelAssetPath:nt,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),a=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),r.srcObject=a,await r.play(),o.width=r.videoWidth||640,o.height=r.videoHeight||480,f=!0,E();function E(){if(f){if(e.drawImage(r,0,0,o.width,o.height),s&&r.readyState>=2)try{let p=s.detectForVideo(r,performance.now()),g=p.landmarks&&p.landmarks[0];g&&T(g)}catch{}u=requestAnimationFrame(E)}}function T(p){if(!d.complete||!d.naturalWidth)return;let g=p[12],I=p[11];if(!g||!I)return;let w=o.width,z=o.height,j=g.x*w,A=g.y*z,S=I.x*w,L=I.y*z,P=Math.hypot(S-j,L-A)*1.8*y,F=d.naturalHeight/d.naturalWidth,i=P*F,c=(j+S)/2,l=(A+L)/2-i*.15;e.save(),e.globalAlpha=.92,e.drawImage(d,c-P/2,l,P,i),e.restore()}function k(){if(f=!1,u&&cancelAnimationFrame(u),a&&a.getTracks().forEach(p=>p.stop()),s&&s.close)try{s.close()}catch{}}return{setScale(p){y=p},capture(){return o.toDataURL("image/jpeg",.92)},stop:k}}var it=["XS","S","M","L","XL","XXL"],st=3e3,ct=20;function V({config:r,api:o,product:n,externalId:e}){let a=_(),s=n.name||a.name,u=n.garment_image_url||a.image,f=null,y=null,d=null,x="M",C=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:T},r.buttonLabel);function E(){document.body.appendChild(C)}function T(){f&&f.remove(),y=t("div",{class:"ff-modal-body"}),f=t("div",{class:"ff-overlay",onclick:i=>{i.target===f&&k()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:k},"\xD7"),y)),document.body.appendChild(f),requestAnimationFrame(()=>f.classList.add("ff-open")),w(),o.trackEvent("widget_open",{productId:n.id})}function k(){if(o.trackEvent("close",{productId:n.id}),p(),f){let i=f;i.classList.remove("ff-open"),setTimeout(()=>i.remove(),200),f=null}}function p(){d&&(d.stop(),d=null)}function g(...i){y.innerHTML="",i.forEach(c=>y.appendChild(c))}function I(){return t("div",{class:"ff-product"},u?t("img",{src:u,alt:s}):null,t("b",{},s))}function w(){p();let i=t("div",{class:"ff-sizes"},...it.map(c=>{let l=t("button",{class:`ff-size${c===x?" ff-active":""}`,type:"button",onclick:()=>{x=c,i.querySelectorAll(".ff-size").forEach(h=>h.classList.remove("ff-active")),l.classList.add("ff-active")}},c);return l}));g(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),I(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:z},t("span",{class:"ff-emoji"},"\u{1F4F8}"),t("span",{},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:U},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u{1F4F9}"),t("span",{},"U\u017Cyj kamerki"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),i,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function z(){let i=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),l=t("div",{class:"ff-error",style:{display:"none"}}),h=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>Z()},"Przymierz"),v=t("div",{}),b=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB"));function W(m){l.textContent=m,l.style.display=m?"block":"none"}async function R(m){let O=q(m);if(O){W(O);return}W(""),i=await B(m),v.innerHTML="",v.appendChild(t("img",{class:"ff-preview",src:i,alt:"Podgl\u0105d"})),h.removeAttribute("disabled")}b.addEventListener("click",()=>c.click()),b.addEventListener("dragover",m=>{m.preventDefault(),b.classList.add("ff-over")}),b.addEventListener("dragleave",()=>b.classList.remove("ff-over")),b.addEventListener("drop",m=>{m.preventDefault(),b.classList.remove("ff-over"),m.dataTransfer.files[0]&&R(m.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&R(c.files[0])});async function Z(){if(i){o.trackEvent("tryon_start",{productId:n.id,metadata:{mode:"photo",size:x}}),j();try{let{sessionId:m}=await o.startPhotoTryon(n.id,i,{size:x});A(m)}catch(m){S(m.message)}}}g(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),b,c,v,l,t("div",{class:"ff-actions"},h,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:w},"\u2190 Wr\xF3\u0107")))}function j(){let i=t("span",{});g(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"To potrwa oko\u0142o 10 sekund"),t("div",{class:"ff-progress"},i)));let c=5,l=setInterval(()=>{c=Math.min(90,c+6),i.style.width=`${c}%`,f||clearInterval(l)},700);return()=>{clearInterval(l),i.style.width="100%"}}function A(i){let c=0,l=j(),h=setInterval(async()=>{if(c+=1,!f){clearInterval(h);return}try{let{status:v,resultImageUrl:b}=await o.getTryonStatus(i);v==="completed"&&b?(clearInterval(h),l(),L(b)):(v==="failed"||c>=ct)&&(clearInterval(h),S("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(v){clearInterval(h),S(v.message)}},st)}function S(i){g(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},i),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:w},"\u2190 Wr\xF3\u0107")))}function L(i){o.trackEvent("tryon_complete",{productId:n.id,metadata:{size:x}}),g(t("h2",{class:"ff-h"},"Twoja przymiarka \u2728"),t("img",{class:"ff-result",src:i,alt:"Wynik przymiarki"}),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:F},"\u{1F6D2} Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{o.trackEvent("download",{productId:n.id}),H(i,"fashionfit.jpg")}},"\u2B07\uFE0F Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:w},"\u{1F501} Przymierz inne")))}async function U(){let i=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),c=t("canvas",{class:"ff-canvas"}),l=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),h=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");l.addEventListener("input",()=>{d&&d.setScale(parseFloat(l.value))}),g(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),h,i,c,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),l,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:v},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:w},"\u2190 Wr\xF3\u0107"))),o.trackEvent("tryon_start",{productId:n.id,metadata:{mode:"ar",size:x}});try{d=await G({video:i,canvas:c,garmentUrl:n.garment_image_url}),h.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{P()}function v(){if(!d)return;let b=d.capture();p(),L(b)}}function P(){p(),g(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:w},"\u2190 Wr\xF3\u0107")))}async function F(){if(o.trackEvent("add_to_cart",{productId:n.id,metadata:{size:x}}),!e){n.product_url&&(window.location=n.product_url);return}try{let i=new FormData;i.append("product_id",e),i.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:i}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),k()}catch{window.location=`${location.pathname}?add-to-cart=${e}`}}return{mount:E,open:T,close:k}}var ft=document.currentScript;async function J(){let r=N(ft);if(!r.apiKey||!r.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!D())return;let o=$();K(r.primaryColor);let n=X(r),e=null;if(o)try{let{products:a}=await n.getProducts(),s=a||[];if(e=s.find(u=>String(u.external_id)===String(o))||null,!e){let u=location.pathname.replace(/\/+$/,"");e=s.find(f=>{if(!f.product_url)return!1;try{return new URL(f.product_url).pathname.replace(/\/+$/,"")===u}catch{return!1}})||null}if(!e){let u=_(),f=y=>String(y||"").trim().toLowerCase();e=s.find(y=>f(y.name)===f(u.name))||null}}catch(a){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",a.message)}if(!e){let a=_();e={id:o||`fallback:${location.pathname}`,external_id:o||null,name:a.name||"Produkt",garment_image_url:a.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",o)}V({config:r,api:n,product:e,externalId:o}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
