const CSS = `
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
`;

export function injectStyles(primaryColor) {
  if (document.getElementById('ff-styles')) return;
  document.documentElement.style.setProperty('--ff-primary', primaryColor);
  const style = document.createElement('style');
  style.id = 'ff-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
