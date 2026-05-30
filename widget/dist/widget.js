(()=>{function t(a,o={},...n){let e=document.createElement(a);for(let[r,s]of Object.entries(o||{}))s!=null&&(r==="class"?e.className=s:r==="html"?e.innerHTML=s:r==="style"&&typeof s=="object"?Object.assign(e.style,s):r.startsWith("on")&&typeof s=="function"?e.addEventListener(r.slice(2).toLowerCase(),s):e.setAttribute(r,s));for(let r of n.flat())r==null||r===!1||e.appendChild(typeof r=="string"?document.createTextNode(r):r);return e}function B(a){let o=window.FashionFitConfig||{},n=a||document.currentScript||[...document.querySelectorAll('script[src*="widget"]')].pop(),e=n&&n.dataset||{};return{apiKey:o.apiKey||e.fashionfitKey||null,shopId:o.shopId||e.fashionfitShop||null,apiUrl:(o.apiUrl||e.fashionfitApi||"https://api.fashionfit.app").replace(/\/$/,""),primaryColor:o.primaryColor||e.fashionfitColor||"#C4883A",buttonLabel:o.buttonLabel||e.fashionfitLabel||"Przymierz wirtualnie \u2728",tryonProvider:o.tryonProvider||e.fashionfitProvider||"auto"}}function Y(){return/\/product\//.test(location.pathname)||document.body.classList.contains("single-product")||!!document.querySelector(".product, .single-product")}function H(){let a=document.body.className.match(/postid-(\d+)/);if(a)return a[1];let o=document.querySelector('[id^="product-"]');if(o&&o.id){let r=o.id.match(/^product-(\d+)$/);if(r)return r[1]}let n=document.querySelector('meta[property="product:retailer_item_id"]');if(n&&n.getAttribute("content"))return n.getAttribute("content");let e=document.querySelector('[data-product_id], button[name="add-to-cart"][value]');return e?e.getAttribute("data-product_id")||e.getAttribute("value"):null}var nt=["image/jpeg","image/png"],it=10*1024*1024;function X(a){return a?nt.includes(a.type)?a.size>it?"Maksymalny rozmiar zdj\u0119cia to 10MB":null:"Dozwolone formaty to JPG i PNG":"Nie wybrano pliku"}function K(a){return new Promise((o,n)=>{let e=new FileReader;e.onload=()=>o(e.result),e.onerror=()=>n(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 pliku")),e.readAsDataURL(a)})}function G(a){return new Promise((o,n)=>{let e=new Image;e.onload=()=>{let r=Number(e.naturalWidth||e.width||0),s=Number(e.naturalHeight||e.height||0),l=r>0&&s>0?Number((r*s/1e6).toFixed(2)):0,c="unknown";l>=4.5?c="ultra":l>=2?c="high":l>=.9?c="medium":l>0&&(c="low"),o({image_width:r,image_height:s,image_megapixels:l,image_quality_bucket:c,output_quality:"max"})},e.onerror=()=>n(new Error("Nie uda\u0142o si\u0119 odczyta\u0107 rozdzielczo\u015Bci zdj\u0119cia")),e.src=a})}async function J(a,o){try{let e=await(await fetch(a)).blob(),r=URL.createObjectURL(e),s=t("a",{href:r,download:o});document.body.appendChild(s),s.click(),s.remove(),URL.revokeObjectURL(r)}catch{window.open(a,"_blank")}}function C(){let a=document.querySelector(".product_title, h1.entry-title, h1"),o=document.querySelector('meta[property="og:title"]'),n=document.querySelector('meta[property="og:image"]'),e=document.querySelector(".woocommerce-product-gallery img, .wp-post-image");return{name:a&&a.textContent.trim()||o&&o.content||"Produkt",image:e&&(e.currentSrc||e.src)||n&&n.content||null}}var st=`
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
`;function V(a){if(document.getElementById("ff-styles"))return;document.documentElement.style.setProperty("--ff-primary",a);let o=document.createElement("style");o.id="ff-styles",o.textContent=st,document.head.appendChild(o)}function Z(a){let o={"X-API-Key":a.apiKey,"Content-Type":"application/json"};async function n(e,r={}){let s=await fetch(a.apiUrl+e,{headers:o,...r}),l=await s.json().catch(()=>({}));if(!s.ok)throw new Error(l.error||`\u017B\u0105danie nie powiod\u0142o si\u0119 (${s.status})`);return l}return{getProducts(){return n(`/api/widget/products/${a.shopId}`)},startPhotoTryon(e,r,s){return n("/api/widget/tryon/photo",{method:"POST",body:JSON.stringify({shopId:a.shopId,productId:e,personImageBase64:r,preferredProvider:a.tryonProvider||"auto",metadata:{...s||{},preferredProvider:a.tryonProvider||"auto"}})})},getTryonStatus(e){return n(`/api/widget/tryon/status/${e}`)},trackEvent(e,r={}){return n("/api/widget/events",{method:"POST",body:JSON.stringify({shopId:a.shopId,eventType:e,...r})}).catch(()=>{})}}}var ft="0.10.14",Q=`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${ft}`,ct=`${Q}/wasm`,lt="https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",W;function dt(){return W||(W=new Function("u","return import(u)")(Q)),W}async function tt({video:a,canvas:o,garmentUrl:n}){let e=o.getContext("2d"),r=null,s=null,l=null,c=!1,x=1,g=new Image;g.crossOrigin="anonymous",n&&(g.src=n);let w=await dt(),U=await w.FilesetResolver.forVisionTasks(ct);s=await w.PoseLandmarker.createFromOptions(U,{baseOptions:{modelAssetPath:lt,delegate:"GPU"},runningMode:"VIDEO",numPoses:1}),r=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!1}),a.srcObject=r,await a.play(),o.width=a.videoWidth||640,o.height=a.videoHeight||480,c=!0,T();function T(){if(c){if(e.drawImage(a,0,0,o.width,o.height),s&&a.readyState>=2)try{let b=s.detectForVideo(a,performance.now()),h=b.landmarks&&b.landmarks[0];h&&F(h)}catch{}l=requestAnimationFrame(T)}}function F(b){if(!g.complete||!g.naturalWidth)return;let h=b[12],S=b[11];if(!h||!S)return;let v=o.width,j=o.height,I=h.x*v,M=h.y*j,_=S.x*v,L=S.y*j,E=Math.hypot(_-I,L-M)*1.8*x,R=g.naturalHeight/g.naturalWidth,i=E*R,f=(I+_)/2,p=(M+L)/2-i*.15;e.save(),e.globalAlpha=.92,e.drawImage(g,f-E/2,p,E,i),e.restore()}function z(){if(c=!1,l&&cancelAnimationFrame(l),r&&r.getTracks().forEach(b=>b.stop()),s&&s.close)try{s.close()}catch{}}return{setScale(b){x=b},capture(){return o.toDataURL("image/jpeg",.92)},stop:z}}var pt=["XS","S","M","L","XL","XXL"],ut=3e3,mt=20;function et({config:a,api:o,product:n,externalId:e}){let r=C(),s=n.name||r.name,l=n.garment_image_url||r.image,c=null,x=null,g=null,w="M",U=t("button",{class:"ff-fab",type:"button","aria-label":"FashionFit",onclick:F},a.buttonLabel);function T(){document.body.appendChild(U)}function F(){c&&c.remove(),x=t("div",{class:"ff-modal-body"}),c=t("div",{class:"ff-overlay",onclick:i=>{i.target===c&&z()}},t("div",{class:"ff-modal"},t("button",{class:"ff-close",type:"button","aria-label":"Zamknij",onclick:z},"\xD7"),x)),document.body.appendChild(c),requestAnimationFrame(()=>c.classList.add("ff-open")),v(),o.trackEvent("widget_open",{productId:n.id})}function z(){if(o.trackEvent("close",{productId:n.id}),b(),c){let i=c;i.classList.remove("ff-open"),setTimeout(()=>i.remove(),200),c=null}}function b(){g&&(g.stop(),g=null)}function h(...i){x.innerHTML="",i.forEach(f=>x.appendChild(f))}function S(){return t("div",{class:"ff-product"},l?t("img",{src:l,alt:s}):null,t("b",{},s))}function v(){b();let i=t("div",{class:"ff-sizes"},...pt.map(f=>{let p=t("button",{class:`ff-size${f===w?" ff-active":""}`,type:"button",onclick:()=>{w=f,i.querySelectorAll(".ff-size").forEach(d=>d.classList.remove("ff-active")),p.classList.add("ff-active")}},f);return p}));h(t("h2",{class:"ff-h"},"Wirtualna przymierzalnia"),S(),t("div",{class:"ff-modes"},t("button",{class:"ff-mode",type:"button",onclick:j},t("span",{class:"ff-emoji"},"\u{1F4F8}"),t("span",{class:"ff-mode-label"},"Wgraj zdj\u0119cie")),t("button",{class:"ff-mode",type:"button",onclick:N},t("span",{class:"ff-badge"},"Nowe"),t("span",{class:"ff-emoji"},"\u{1F4F9}"),t("span",{class:"ff-mode-label"},"U\u017Cyj kamerki"))),t("div",{class:"ff-sub"},"Wybierz rozmiar"),i,t("div",{class:"ff-privacy"},"\u{1F512} Twoje zdj\u0119cia nie s\u0105 zapisywane"))}function j(){let i=null,f=null,p=t("input",{type:"file",accept:"image/jpeg,image/png",style:{display:"none"}}),d=t("div",{class:"ff-error",style:{display:"none"}}),u=t("button",{class:"ff-btn",type:"button",disabled:"true",onclick:()=>rt()},"Przymierz"),m=t("div",{class:"ff-drop"},t("span",{class:"ff-emoji"},"\u2B06\uFE0F"),t("span",{},"Przeci\u0105gnij zdj\u0119cie lub kliknij, aby wgra\u0107"),t("span",{class:"ff-sub"},"JPG lub PNG, maks. 10MB")),k=t("div",{class:"ff-upload-wrap"},m),A=t("img",{class:"ff-preview",alt:"Podgl\u0105d zdj\u0119cia"}),O=t("div",{class:"ff-upload-meta"}),at=t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>p.click()},"Zmie\u0144 zdj\u0119cie"),q=t("div",{class:"ff-upload-card",style:{display:"none"}},A,O,at);function $(y){d.textContent=y,d.style.display=y?"block":"none"}async function D(y){let P=X(y);if(P){$(P);return}$(""),i=await K(y);try{f=await G(i)}catch{f={output_quality:"max"}}A.src=i,O.textContent=f&&f.image_width&&f.image_height?`Rozdzielczo\u015B\u0107: ${f.image_width}\xD7${f.image_height} \xB7 ${f.image_megapixels} MP \xB7 jako\u015B\u0107 wej\u015Bciowa: ${f.image_quality_bucket}`:"Jako\u015B\u0107 wej\u015Bciowa: automatycznie wykryta",m.style.display="none",q.style.display="block",u.removeAttribute("disabled")}m.addEventListener("click",()=>p.click()),m.addEventListener("dragover",y=>{y.preventDefault(),m.classList.add("ff-over")}),m.addEventListener("dragleave",()=>m.classList.remove("ff-over")),m.addEventListener("drop",y=>{y.preventDefault(),m.classList.remove("ff-over"),y.dataTransfer.files[0]&&D(y.dataTransfer.files[0])}),p.addEventListener("change",()=>{p.files[0]&&D(p.files[0])});async function rt(){if(!i)return;let y={mode:"photo",size:w,output_quality:"max",...f||{}};o.trackEvent("tryon_start",{productId:n.id,metadata:y}),I();try{let{sessionId:P}=await o.startPhotoTryon(n.id,i,y);M(P)}catch(P){_(P.message)}}h(t("h2",{class:"ff-h"},"\u{1F4F8} Wgraj swoje zdj\u0119cie"),k,q,p,d,t("div",{class:"ff-actions"},u,t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function I(){let i=t("span",{}),f=[t("div",{class:"ff-step ff-step-active"},"1. Analiza zdj\u0119cia"),t("div",{class:"ff-step"},"2. Dopasowanie produktu"),t("div",{class:"ff-step"},"3. Render HD"),t("div",{class:"ff-step"},"4. Finalizacja")],p=t("div",{class:"ff-steps"},f);h(t("div",{class:"ff-loading"},t("div",{class:"ff-spinner"}),t("b",{},"Generuj\u0119 dla Ciebie..."),t("div",{class:"ff-sub"},"Zachowujemy najwy\u017Csz\u0105 jako\u015B\u0107 finalnego zdj\u0119cia"),p,t("div",{class:"ff-progress"},i)));let d=5,u=0,m=setInterval(()=>{d=Math.min(90,d+6),i.style.width=`${d}%`,d>=25&&u<1&&(u=1),d>=55&&u<2&&(u=2),d>=80&&u<3&&(u=3),f.forEach((k,A)=>{k.classList.remove("ff-step-done","ff-step-active"),A<u&&k.classList.add("ff-step-done"),A===u&&k.classList.add("ff-step-active")}),c||clearInterval(m)},700);return()=>{clearInterval(m),i.style.width="100%",f.forEach(k=>{k.classList.remove("ff-step-active"),k.classList.add("ff-step-done")})}}function M(i){let f=0,p=I(),d=setInterval(async()=>{if(f+=1,!c){clearInterval(d);return}try{let{status:u,resultImageUrl:m}=await o.getTryonStatus(i);u==="completed"&&m?(clearInterval(d),p(),L(m)):(u==="failed"||f>=mt)&&(clearInterval(d),_("Nie uda\u0142o si\u0119 wygenerowa\u0107 przymiarki. Spr\xF3buj ponownie."))}catch(u){clearInterval(d),_(u.message)}},ut)}function _(i){h(t("h2",{class:"ff-h"},"Co\u015B posz\u0142o nie tak"),t("div",{class:"ff-error"},i),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:j},"Spr\xF3buj ponownie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}function L(i){o.trackEvent("tryon_complete",{productId:n.id,metadata:{size:w,output_quality:"max"}}),h(t("div",{class:"ff-result-head"},t("h2",{class:"ff-h"},"Twoja przymiarka"),t("div",{class:"ff-result-pills"},t("span",{class:"ff-pill"},`Rozmiar ${w}`),t("span",{class:"ff-pill"},"MAX QUALITY"))),t("div",{class:"ff-result-stage"},t("img",{class:"ff-result",src:i,alt:"Wynik przymiarki"})),t("div",{class:"ff-result-note"},"Wskaz\xF3wka: najlepiej dzia\u0142a zdj\u0119cie samego ubrania bez torebki i dodatk\xF3w."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:R},"Dodaj do koszyka"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>window.open(i,"_blank","noopener,noreferrer")},"Otw\xF3rz pe\u0142ny podgl\u0105d"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:()=>{o.trackEvent("download",{productId:n.id}),J(i,"fashionfit.jpg")}},"Pobierz zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"Przymierz inne")))}async function N(){let i=t("video",{class:"ff-video",playsinline:"true",muted:"true"}),f=t("canvas",{class:"ff-canvas"}),p=t("input",{class:"ff-slider",type:"range",min:"0.6",max:"1.6",step:"0.05",value:"1"}),d=t("div",{class:"ff-sub"},"Uruchamiam kamer\u0119...");p.addEventListener("input",()=>{g&&g.setScale(parseFloat(p.value))}),h(t("h2",{class:"ff-h"},"\u{1F4F9} Przymierzalnia na \u017Cywo"),d,i,f,t("label",{class:"ff-sub"},"Dopasuj rozmiar"),p,t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:u},"\u{1F4F8} Zr\xF3b zdj\u0119cie"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107"))),o.trackEvent("tryon_start",{productId:n.id,metadata:{mode:"ar",size:w}});try{g=await tt({video:i,canvas:f,garmentUrl:n.garment_image_url}),d.textContent="Sta\u0144 w kadrze ca\u0142\u0105 sylwetk\u0105"}catch{E()}function u(){if(!g)return;let m=g.capture();b(),L(m)}}function E(){b(),h(t("h2",{class:"ff-h"},"Kamera niedost\u0119pna"),t("div",{class:"ff-sub"},"Nie uda\u0142o si\u0119 uzyska\u0107 dost\u0119pu do kamery. Skorzystaj z trybu zdj\u0119cia."),t("div",{class:"ff-actions"},t("button",{class:"ff-btn",type:"button",onclick:j},"\u{1F4F8} U\u017Cyj trybu zdj\u0119cia"),t("button",{class:"ff-btn ff-btn-ghost",type:"button",onclick:v},"\u2190 Wr\xF3\u0107")))}async function R(){if(o.trackEvent("add_to_cart",{productId:n.id,metadata:{size:w}}),!e){n.product_url&&(window.location=n.product_url);return}try{let i=new FormData;i.append("product_id",e),i.append("quantity","1"),await fetch(`${location.origin}/?wc-ajax=add_to_cart`,{method:"POST",body:i}),document.body.dispatchEvent(new Event("wc_fragment_refresh")),z()}catch{window.location=`${location.pathname}?add-to-cart=${e}`}}return{mount:T,open:F,close:z}}var gt=document.currentScript;async function ot(){let a=B(gt);if(!a.apiKey||!a.shopId){console.warn("[FashionFit] Brak apiKey lub shopId \u2014 widget nie zosta\u0142 uruchomiony.");return}if(!Y())return;let o=H();V(a.primaryColor);let n=Z(a),e=null;if(o)try{let{products:r}=await n.getProducts(),s=r||[];if(e=s.find(l=>String(l.external_id)===String(o))||null,!e){let l=location.pathname.replace(/\/+$/,"");e=s.find(c=>{if(!c.product_url)return!1;try{return new URL(c.product_url).pathname.replace(/\/+$/,"")===l}catch{return!1}})||null}if(!e){let l=C(),c=x=>String(x||"").trim().toLowerCase();e=s.find(x=>c(x.name)===c(l.name))||null}}catch(r){console.warn("[FashionFit] Nie uda\u0142o si\u0119 pobra\u0107 produkt\xF3w:",r.message)}if(!e){let r=C();e={id:o||`fallback:${location.pathname}`,external_id:o||null,name:r.name||"Produkt",garment_image_url:r.image||null,product_url:location.href,category:"tops",variants:null,_fallback:!0},console.warn("[FashionFit] Nie znaleziono zsynchronizowanego produktu dla id, uruchamiam fallback:",o)}if(String(e.category||"").toLowerCase()==="accessories"){console.info("[FashionFit] Pomijam widget try-on dla kategorii accessories.");return}et({config:a,api:n,product:e,externalId:o}).mount()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ot):ot();})();
