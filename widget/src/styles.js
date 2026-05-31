const CSS = `
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
`;

export function injectStyles(primaryColor) {
  if (document.getElementById('ff-styles')) return;
  document.documentElement.style.setProperty('--ff-primary', primaryColor);
  const style = document.createElement('style');
  style.id = 'ff-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
