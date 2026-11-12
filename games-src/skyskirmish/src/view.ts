// Canvas sizing: the canvas is full-bleed; the 9:16 lane is placed inside it by layout.ts and
// the HUD reads the lane rectangle from CSS variables. Drawn at devicePixelRatio (capped at 2).
import { computeLayout, type Insets, type Layout } from './layout';

export interface Geom {
  cssW: number;
  cssH: number;
  dpr: number;
  layout: Layout;
}

export interface View {
  ctx: CanvasRenderingContext2D;
  geom(): Geom;
  resize(): void;
}

function readInsets(): Insets {
  const probe = document.getElementById('insets');
  if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
  const cs = getComputedStyle(probe);
  const n = (v: string): number => parseFloat(v) || 0;
  return { top: n(cs.paddingTop), right: n(cs.paddingRight), bottom: n(cs.paddingBottom), left: n(cs.paddingLeft) };
}

function publish(app: HTMLElement, l: Layout): void {
  app.dataset.layout = l.mode;
  const set = (k: string, v: number): void => app.style.setProperty(k, `${Math.round(v * 100) / 100}px`);
  set('--lx', l.x);
  set('--ly', l.y);
  set('--lw', l.w);
  set('--lh', l.h);
  set('--zone', l.zone);
}

export function createView(canvas: HTMLCanvasElement, field: HTMLElement, stage: HTMLElement): View {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const app = stage.parentElement ?? stage;
  let geom: Geom = { cssW: 1, cssH: 1, dpr: 1, layout: computeLayout(1, 1) };
  const resize = (): void => {
    const cssW = Math.max(1, stage.clientWidth);
    const cssH = Math.max(1, stage.clientHeight);
    const layout = computeLayout(cssW, cssH, readInsets());
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    field.style.width = `${cssW}px`;
    field.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    geom = { cssW, cssH, dpr, layout };
    publish(app, layout);
  };
  new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);
  resize();
  return { ctx, geom: () => geom, resize };
}
