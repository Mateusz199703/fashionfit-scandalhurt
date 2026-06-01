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
`;

export function injectStyles(primaryColor) {
  if (document.getElementById('ff-styles')) return;
  document.documentElement.style.setProperty('--ff-primary', primaryColor);
  const style = document.createElement('style');
  style.id = 'ff-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}
