// Sizes the canvas to its stage (ResizeObserver, not per frame) and keeps the table view in sync.
import { LAYOUT } from './config/layout';
import { type View, layoutView } from './view';

export class CanvasView {
  cssW = 0;
  cssH = 0;
  dpr = 1;
  view: View | null = null;
  private readonly ctx2d: CanvasRenderingContext2D | null;

  constructor(readonly canvas: HTMLCanvasElement, private readonly stage: HTMLElement, private readonly onView: (v: View) => void) {
    this.ctx2d = canvas.getContext('2d');
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.update()).observe(stage);
    window.addEventListener('resize', () => this.update());
    window.addEventListener('orientationchange', () => this.update());
  }

  get ctx(): CanvasRenderingContext2D | null { return this.ctx2d; }

  update(): void {
    const w = Math.floor(this.stage.clientWidth);
    const h = Math.floor(this.stage.clientHeight);
    if (w < 40 || h < 40) return;
    const dpr = Math.min(window.devicePixelRatio || 1, LAYOUT.dprCap);
    if (w === this.cssW && h === this.cssH && dpr === this.dpr) return;
    this.cssW = w; this.cssH = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    this.view = layoutView(w, h);
    this.onView(this.view);
  }
}
