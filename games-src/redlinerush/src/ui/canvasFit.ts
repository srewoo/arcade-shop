// Sizes the canvas to its stage (devicePixelRatio-aware, cap 2) and refreshes the shared view layout.
import { applyLayout, view } from '../viewport';

export function fitCanvas(canvas: HTMLCanvasElement, stage: HTMLElement): void {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  if (w <= 0 || h <= 0) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  applyLayout(w, h);
  stage.parentElement?.style.setProperty('--side', `${Math.round(view.roadLeft * view.scale)}px`);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
}

export function observeFit(canvas: HTMLCanvasElement, stage: HTMLElement): void {
  const run = (): void => fitCanvas(canvas, stage);
  new ResizeObserver(run).observe(stage);
  window.addEventListener('resize', run);
  run();
}
