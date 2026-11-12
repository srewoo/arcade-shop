// ?fps overlay: frame time (average and p95), draw calls and triangles from renderer.info, and the governor step.
// Debug aid only (shown with ?fps); it samples the last 120 frames in a preallocated ring, so it allocates nothing per frame.
import { renderer } from './systems.js';
import { governorSteps } from './quality.js';

const N = 120;
const ring = new Float32Array(N);
const scratch = new Float32Array(N);
let count = 0;
let head = 0;
let node = null;
let lastPaint = 0;

export function initFpsOverlay() {
  node = Object.assign(document.createElement('pre'), { id: 'fps' });
  node.setAttribute('aria-hidden', 'true');
  document.body.appendChild(node);
}

/** Call once per rendered frame with the frame time in seconds. */
export function sampleFps(dt, now) {
  if (!node) return;
  ring[head] = dt * 1000;
  head = (head + 1) % N;
  if (count < N) count++;
  if (now - lastPaint < 500 || count < 10) return;
  lastPaint = now;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    scratch[i] = ring[i];
    sum += ring[i];
  }
  const sorted = scratch.subarray(0, count).sort();
  const p95 = sorted[Math.min(count - 1, Math.floor(count * 0.95))];
  const info = renderer.info;
  node.textContent = `FPS ${(1000 / (sum / count)).toFixed(0)}  avg ${(sum / count).toFixed(1)} ms  p95 ${p95.toFixed(1)} ms\ncalls ${info.render.calls}  tris ${info.render.triangles}  q-step ${governorSteps()}`;
}
