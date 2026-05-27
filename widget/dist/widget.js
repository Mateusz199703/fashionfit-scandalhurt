(()=>{function t(r,e={},...n){let o=document.createElement(r);for(let[i,s]of Object.entries(e||{}))s!=null&&(i==="class"?o.className=s:i==="html"?o.innerHTML=s:i==="style"&&typeof s=="object"?Object.assign(o.style,s):i.startsWith("on")&&typeof s=="function"?o.addEventListener(i.slice(2).toLowerCase(),s):o.setAttribute(i,s));for(let i of n.flat())i==null||i===!1||o.appendChild(typeof i=="string"?document.createTextNode(i):i);return o}function R(r){let e=window.FashionFitConfig||{},n=r||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),o=n&&n.dataset||{};return{apiKey:e.apiKey||o.fashionfitKey||null,shopId:e.shopId||o.fashionfitShop||null,apiUrl:(e.apiUrl||o.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:e.primaryColor||o.fashionfitColor||"#C4883A",buttonLabel:e.buttonLabel||o.fashionfitLabel||"Przymierz wirtualnie \u2728"}}function N(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function D(){let r=document.body.className.match(/postid-(\d+)/);if(r)return r[1];let e=document.querySelector('meta[property="product:retailer_item_id"]');if(e&&e.getAttribute("content"))return e.getAttribute("content");let n=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return n?n.getAttribute("data-product_id")||n.getAttribute("value"):null}var Q=["image/jpeg","image/png"],tt=10*1024*1024;function q(r){return r?Q.includes(r.type)?r.size>tt?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function $(r){return new Promise((e,n)=>{let o=new FileReader;o.onload=()=>e(o.result),o.onerror=()=>n(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),o.readAsDataURL(r)})}async function B(r,e){try{let o=await(await fetch(r)).blob(),i=URL.createObjectURL(o),s=t("a",{href:i,download:e});document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(i)}catch{window.open(r,"_blank")}}function H(){let r=document.querySelector(".product_title, h1.entry-title, h1"),e=document.querySelector('meta[property="og:title"]'),n=document.querySelector('meta[property="og:image"]'),o=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:r&&r.textContent.trim()||e&&e.content||"Produkt",image:o&&(o.currentSrc||o.src)||n&&n.content||null}}var et=`
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
`;function K(r){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",r);let e=document.createElement("style");e.id="ff-styles",e.textContent=et,document.head.appendChild(e)}function X(r){let e={"X-API-Key":r.apiKey,"Content-Type":"application/json"};async function n(o,i={}){let s=await fetch(r.apiUrl+o,{headers:e,...i}),x=await s.json().catch(()=>({}));if(!s.ok)throw new Error(x.error||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${s.status})`);return x}return{getProducts(){return n(`/api/widget/products/${r.shopId}`)},startPhotoTryon(o,i,s){return n("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:r.shopId,productId:o,personImageBase64:i,metadata:s})})},getTryonStatus(o){return n(`/api/widget/tryon/status/${o}`)},trackEvent(o,i={}){return n("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:r.shopId,eventType:o,...i})}).catch(()=>{})}}}var ot="0.10.14",Y=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ot}`,rt=`${Y}/wasm`,nt="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",F;function at(){return F||(F=new Function("u","return import(u)")(Y)),F}async function G({video:r,canvas:e,garmentUrl:n}){let o=e.getContext("2d"),i=null,s=null,x=null,p=!1,w=1,d=new Image;d.crossOrigin="anonymous",n&&(d.src=n);let y=await at(),A=await y.FilesetResolver.forVisionTasks(rt);s=await y.PoseLandmarker.createFromOptions(A,{baseOptions:{modelAssetPath:nt,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),i=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),r.srcObject=i,await r.play(),e.width=r.videoWidth||640,e.height=r.videoHeight||480,p=!0,E();function E(){if(p){if(o.drawImage(r,0,0,e.width,e.height),s&&r.readyState>=2)try{let l=s.detectForVideo(r,performance.now()),m=l.landmarks&&l.landmarks[0];m&&_(m)}catch{}x=requestAnimationFrame(E)}}function _(l){if(!d.complete||!d.naturalWidth)return;let m=l[12],j=l[11];if(!m||!j)return;let v=e.width,z=e.height,I=m.x*v,T=m.y*z,S=j.x*v,L=j.y*z,P=Math.hypot(S-I,L-T)*1.8*w,C=d.naturalHeight/d.naturalWidth,a=P*C,c=(I+S)/2,f=(T+L)/2-a*.15;o.save(),o.globalAlpha=.92,o.drawImage(d,c-P/2,f,P,a),o.restore()}function k(){if(p=!1,x&&cancelAnimationFrame(x),i&&i.getTracks().forEach(l=>l.stop()),s&&s.close)try{s.close()}catch{}}return{setScale(l){w=l},capture(){return e.toDataURL("image/jpeg",.92)},stop:k}}var it=["XS","S","M","L","XL","XXL"],st=3e3,ct=20;function V({config:r,api:e,product:n,externalId:o}){let i=H(),s=n.name||i.name,x=n.garment_image_url||i.image,p=null,w=null,d=null,y="M",A=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:_},r.buttonLabel);function E(){document.body.appendChild(A)}function _(){p&&p.remove(),w=t("div",{class:"ff-modal-body"}),p=t("div",{class:"ff-overlay",onclick:a=>{a.target===p&&k()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:k},"\xD7"),w)),document.body.appendChild(p),requestAnimationFrame(()=>p.classList.add("ff-open")),v(),e.trackEvent("widget_open",{productId:n.id})}function k(){if(e.trackEvent("close",{productId:n.id}),l(),p){let a=p;a.classList.remove("ff-open"),setTimeout(()=>a.remove(),200),p=null}}function l(){d&&(d.stop(),d=null)}function m(...a){w.innerHTML="",a.forEach(c=>w.appendChild(c))}function j(){return t("div",{class:"ff-product"},x?t("img",{src:x,alt:s}):null,t("b",{},s))}function v(){l();let a=t("div",{class:"ff-sizes"},...it.map(c=>{let f=t("button",{class:`ff-size${c===y?" ff-active":""}`,type:"button",onclick:()=>{y=c,a.querySelectorAll(".ff-size").forEach(g=>g.classList.remove("ff-active")),f.classList.add("ff-active")}},c);return f}));m(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),j(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:z},t("span",{class:"ff-emoji"},"\u{1F4F8}"),t("span",{},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:M},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u{1F4F9}"),t("span",{},"U\u017Cyj kamerki"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),a,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function z(){let a=null,c=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),f=t("div",{class:"ff-error",style:{display:"none"}}),g=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>Z()},"Przymierz"),h=t("div",{}),b=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB"));function U(u){f.textContent=u,f.style.display=u?"block":"none"}async function W(u){let O=q(u);if(O){U(O);return}U(""),a=await $(u),h.innerHTML="",h.appendChild(t("img",{class:"ff-preview",src:a,alt:"Podgl\u0105d"})),g.removeAttribute("disabled")}b.addEventListener("click",()=>c.click()),b.addEventListener("dragover",u=>{u.preventDefault(),b.classList.add("ff-over")}),b.addEventListener("dragleave",()=>b.classList.remove("ff-over")),b.addEventListener("drop",u=>{u.preventDefault(),b.classList.remove("ff-over"),u.dataTransfer.files[0]&&W(u.dataTransfer.files[0])}),c.addEventListener("change",()=>{c.files[0]&&W(c.files[0])});async function Z(){if(a){e.trackEvent("tryon_start",{productId:n.id,metadata:{mode:"photo",size:y}}),I();try{let{sessionId:u}=await e.startPhotoTryon(n.id,a,{size:y});T(u)}catch(u){S(u.message)}}}m(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),b,c,h,f,t("div",{class:"ff-actions"},g,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function I(){let a=t("span",{});m(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"To potrwa oko\u0142o 10 sekund"),t("div",{class:"ff-progress"},a)));let c=5,f=setInterval(()=>{c=Math.min(90,c+6),a.style.width=`${c}%`,p||clearInterval(f)},700);return()=>{clearInterval(f),a.style.width="100%"}}function T(a){let c=0,f=I(),g=setInterval(async()=>{if(c+=1,!p){clearInterval(g);return}try{let{status:h,resultImageUrl:b}=await e.getTryonStatus(a);h==="completed"&&b?(clearInterval(g),f(),L(b)):(h==="failed"||c>=ct)&&(clearInterval(g),S("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(h){clearInterval(g),S(h.message)}},st)}function S(a){m(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},a),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function L(a){e.trackEvent("tryon_complete",{productId:n.id,metadata:{size:y}}),m(t("h2",{class:"ff-h"},"Twoja przymiarka \u2728"),t("img",{class:"ff-result",src:a,alt:"Wynik przymiarki"}),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:C},"\u{1F6D2} Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{e.trackEvent("download",{productId:n.id}),B(a,"fashionfit.jpg")}},"\u2B07\uFE0F Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u{1F501} Przymierz inne")))}async function M(){let a=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),c=t("canvas",{class:"ff-canvas"}),f=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),g=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");f.addEventListener("input",()=>{d&&d.setScale(parseFloat(f.value))}),m(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),g,a,c,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),f,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:h},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107"))),e.trackEvent("tryon_start",{productId:n.id,metadata:{mode:"ar",size:y}});try{d=await G({video:a,canvas:c,garmentUrl:n.garment_image_url}),g.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{P()}function h(){if(!d)return;let b=d.capture();l(),L(b)}}function P(){l(),m(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:z},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}async function C(){if(e.trackEvent("add_to_cart",{productId:n.id,metadata:{size:y}}),!o){n.product_url&&(window.location=n.product_url);return}try{let a=new FormData;a.append("product_id",o),a.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:a}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),k()}catch{window.location=`${location.pathname}?add-to-cart=${o}`}}return{mount:E,open:_,close:k}}var ft=document.currentScript;async function J(){let r=R(ft);if(!r.apiKey||!r.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!N())return;let e=D();K(r.primaryColor);let n=X(r),o=null;if(e)try{let{products:i}=await n.getProducts();o=(i||[]).find(s=>String(s.external_id)===String(e))||null}catch(i){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",i.message)}if(!o){console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id:",e);return}V({config:r,api:n,product:o,externalId:e}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();})();
