// Live AR via MediaPipe Pose, lazy-loaded from jsDelivr only when needed so it
// never enters the main bundle.
const MP_VERSION = '0.10.14';
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const WASM_URL = `${MP_URL}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

let modulePromise;
function loadMediaPipe() {
  if (!modulePromise) {
    // Hide the URL import from esbuild so it stays a runtime dynamic import.
    const dynamicImport = new Function('u', 'return import(u)');
    modulePromise = dynamicImport(MP_URL);
  }
  return modulePromise;
}

export async function createArSession({ video, canvas, garmentUrl }) {
  const ctx = canvas.getContext('2d');
  let stream = null;
  let landmarker = null;
  let raf = null;
  let running = false;
  let scale = 1;

  const garment = new Image();
  garment.crossOrigin = 'anonymous';
  if (garmentUrl) garment.src = garmentUrl;

  const vision = await loadMediaPipe();
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
  landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  });

  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  running = true;
  renderLoop();

  function renderLoop() {
    if (!running) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (landmarker && video.readyState >= 2) {
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks && result.landmarks[0];
        if (landmarks) drawGarment(landmarks);
      } catch (e) {
        /* transient detection errors are non-fatal */
      }
    }
    raf = requestAnimationFrame(renderLoop);
  }

  function drawGarment(lm) {
    if (!garment.complete || !garment.naturalWidth) return;
    const rs = lm[12]; // right shoulder
    const ls = lm[11]; // left shoulder
    if (!rs || !ls) return;

    const W = canvas.width;
    const H = canvas.height;
    const x1 = rs.x * W;
    const y1 = rs.y * H;
    const x2 = ls.x * W;
    const y2 = ls.y * H;
    const shoulderWidth = Math.hypot(x2 - x1, y2 - y1);
    const garmentWidth = shoulderWidth * 1.8 * scale;
    const ratio = garment.naturalHeight / garment.naturalWidth;
    const garmentHeight = garmentWidth * ratio;
    const centerX = (x1 + x2) / 2;
    const topY = (y1 + y2) / 2 - garmentHeight * 0.15;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(garment, centerX - garmentWidth / 2, topY, garmentWidth, garmentHeight);
    ctx.restore();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (landmarker && landmarker.close) {
      try { landmarker.close(); } catch (e) { /* ignore */ }
    }
  }

  return {
    setScale(value) { scale = value; },
    capture() { return canvas.toDataURL('image/jpeg', 0.92); },
    stop,
  };
}
