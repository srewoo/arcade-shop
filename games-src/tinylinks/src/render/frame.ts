// Draws one frame: rough, pre-rendered course layer, animated scenery, ball, particles, guide, callout.
import { CONFIG } from '../config';
import type { Aim } from '../game/aim';
import type { FxEvent } from '../game/game';
import { BALL_COLORS, markerFor, type ColorId } from '../game/players';
import type { Sim } from '../physics/sim';
import type { HoleDef } from '../physics/types';
import { drawBall } from './ball';
import { drawCallout, type Callout } from './callout';
import { LAYER, buildLayer, type Layer } from './courseLayer';
import { drawFlag, drawMovers, drawSlopeChevrons, drawWaterShimmer } from './dynamic';
import { drawGuide, drawPutter } from './guide';
import { PAL } from './palette';
import { Particles } from './particles';
import { textures } from './textures';
import type { View } from './view';

export interface Scene {
  hole: HoleDef; sim: Sim; alpha: number; color: ColorId; seat: number; label: string;
  sinkT: number; aim: Aim | null;
}
export interface DrawOpts { reduced: boolean; assist: boolean; time: number; dt: number }

const CONFETTI = ['#ffd23f', '#ff5a4e', '#3fa9ff', '#7be07f', '#ff7ac6', '#ffffff'];

export class Renderer {
  readonly particles = new Particles();
  private layer: Layer | null = null;
  private layerKey = '';
  private callout: Callout | null = null;
  private cup = { x: 0, y: 0 };
  private ball = { x: 0, y: 0 };
  private bgKey = '';
  private bg: HTMLCanvasElement | null = null;

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  /** React to a game event with particles and callouts. */
  fx(e: FxEvent, reduced: boolean): void {
    const p = this.particles;
    switch (e.type) {
      case 'strike': p.burst('dust', this.ball.x, this.ball.y, 5, 40, ['rgba(230,245,220,0.6)'], reduced); break;
      case 'wall': if (e.speed > 90) p.burst('dust', e.x, e.y, 3, 30, ['rgba(255,245,215,0.7)'], reduced); break;
      case 'post': p.burst('drop', e.x, e.y, 6, 80, ['#ffb09a', '#ffffff'], reduced); break;
      case 'sand': p.burst('sand', e.x, e.y, 9, 60, ['#e8d391', '#c9a95c'], reduced); break;
      case 'splash': {
        const water = e.kind === 'water';
        p.burst('drop', e.x, e.y, 26, 120, water ? ['#bfe8ff', '#5cc0f2', '#ffffff'] : ['#c47a3a', '#6b3d17'], reduced);
        p.ring(e.x, e.y, water ? '#e6f6ff' : '#c47a3a');
        p.ring(e.x, e.y, water ? '#9bd8f7' : '#6b3d17', 0.12);
        break;
      }
      case 'sink': p.ring(e.x, e.y, '#ffffff'); break;
      case 'callout': this.onCallout(e, reduced); break;
      default: break;
    }
  }

  private onCallout(e: Extract<FxEvent, { type: 'callout' }>, reduced: boolean): void {
    this.callout = { text: e.text, sub: '', gold: e.celebrate, blue: e.kind === 'water', age: 0 };
    if (e.celebrate) this.particles.burst('confetti', this.cup.x, this.cup.y, e.kind === 'ace' ? 70 : 34, 150, CONFETTI, reduced);
  }

  /** Drop transient effects (new match, back to title). */
  reset(): void { this.callout = null; this.particles.clear(); }

  setCalloutSub(sub: string): void { if (this.callout) this.callout.sub = sub; }

  private ensureLayer(hole: HoleDef, v: View, assist: boolean): Layer {
    const scale = Math.min(v.scale * v.dpr, 2.4);
    const key = `${hole.id}|${scale.toFixed(2)}|${assist}`;
    if (!this.layer || this.layerKey !== key) {
      this.layer = buildLayer(hole, scale, assist, this.layer?.canvas);
      this.layerKey = key;
    }
    return this.layer;
  }

  /** Rough + vignette are static per screen size: render once, blit each frame. */
  private drawBackground(v: View): void {
    const c = this.ctx;
    const key = `${v.w}x${v.h}@${v.dpr}`;
    if (key !== this.bgKey || !this.bg) {
      const cv = this.bg ?? document.createElement('canvas');
      cv.width = Math.round(v.w * v.dpr);
      cv.height = Math.round(v.h * v.dpr);
      const b = cv.getContext('2d');
      if (b) {
        b.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
        b.fillStyle = PAL.rough;
        b.fillRect(0, 0, v.w, v.h);
        const pat = b.createPattern(textures().rough, 'repeat');
        if (pat) { b.fillStyle = pat; b.fillRect(0, 0, v.w, v.h); }
        const g = b.createRadialGradient(v.w / 2, v.h / 2, Math.min(v.w, v.h) * 0.35, v.w / 2, v.h / 2, Math.hypot(v.w, v.h) * 0.62);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,12,4,0.55)');
        b.fillStyle = g;
        b.fillRect(0, 0, v.w, v.h);
      }
      this.bg = cv;
      this.bgKey = key;
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(this.bg, 0, 0);
  }

  draw(s: Scene, v: View, o: DrawOpts): void {
    const c = this.ctx;
    const hole = s.hole;
    this.cup = hole.cup;
    this.drawBackground(v);
    const layer = this.ensureLayer(hole, v, o.assist);
    c.setTransform(v.dpr * v.a, v.dpr * v.b, v.dpr * v.c, v.dpr * v.d, v.dpr * v.e, v.dpr * v.f);
    c.drawImage(layer.canvas, LAYER.x, LAYER.y, LAYER.w, LAYER.h);
    const unrot = v.rot ? -Math.PI / 2 : 0;
    this.drawScenery(s, o);
    this.drawBallAndFx(s, o, unrot);
    if (this.callout) {
      this.callout.age += o.dt;
      drawCallout(c, this.callout, v, o.reduced);
      if (this.callout.age >= CONFIG.fx.calloutSec) this.callout = null;
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawScenery(s: Scene, o: DrawOpts): void {
    const c = this.ctx;
    const hole = s.hole;
    drawWaterShimmer(c, hole, o.time, o.reduced);
    for (const sl of hole.slopes ?? []) drawSlopeChevrons(c, sl, o.time, o.reduced);
    if (hole.movers) drawMovers(c, hole.movers, s.sim.time + s.alpha * CONFIG.sim.dt);
  }

  private drawBallAndFx(s: Scene, o: DrawOpts, unrot: number): void {
    const c = this.ctx;
    const b = s.sim.ball;
    const x = b.px + (b.x - b.px) * s.alpha;
    const y = b.py + (b.y - b.py) * s.alpha;
    this.ball.x = x; this.ball.y = y;
    const sinking = s.sim.state === 'sunk';
    const k = sinking ? Math.max(0, 1 - s.sinkT * 1.1) : 1;
    const hidden = s.sim.state === 'water';
    if (s.aim) drawPutter(c, { x, y }, s.aim);
    if (!hidden) {
      drawBall(c, { x, y, roll: b.roll, color: s.color, marker: markerFor(s.seat), scale: k, assist: o.assist, label: s.label }, unrot);
    }
    drawFlag(c, s.hole.cup, o.time, unrot, o.reduced);
    this.particles.update(o.dt);
    this.particles.draw(c);
    if (s.aim) drawGuide(c, s.sim, s.aim, o.time, unrot, o.reduced);
  }

  /** Colour list for UI swatches that match what the ball draws. */
  static readonly colors = BALL_COLORS;
}
