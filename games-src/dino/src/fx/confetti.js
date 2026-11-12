// Short 2D confetti burst on a full-screen canvas (new best).  Never started under reduced motion (feedback.js).
import { JUICE } from '../tuning.js';

const COLORS = ['#ffd23f', '#ff7a63', '#4fd8ff', '#b388ff', '#a6e22e', '#fff6e6'];

export class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bits = [];
    this.raf = 0;
    this.endAt = 0;
  }

  /** @param count number of pieces (callers scale it for quality / device) */
  start(count = JUICE.confettiCount, ms = JUICE.confettiMs) {
    if (!this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.dpr = dpr;
    this.bits = Array.from({ length: count }, (_, i) => ({
      x: window.innerWidth * (0.2 + 0.6 * Math.random()),
      y: window.innerHeight * 0.3,
      vx: (Math.random() - 0.5) * 520,
      vy: -200 - Math.random() * 380,
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 12,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color: COLORS[i % COLORS.length],
    }));
    this.endAt = performance.now() + ms;
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((t) => this._frame(t));
  }

  stop() {
    cancelAnimationFrame(this.raf);
    this.bits = [];
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  _frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const fade = Math.min(1, Math.max(0, (this.endAt - now) / 500));
    for (const b of this.bits) {
      b.vy += 900 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (now < this.endAt) this.raf = requestAnimationFrame((t) => this._frame(t));
    else this.stop();
  }
}
