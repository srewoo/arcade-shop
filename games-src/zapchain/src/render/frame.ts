// The renderer: owns the pooled effects, caches (backdrop, sprites) and draws one frame.
import { CONFIG } from '../config';
import type { Game } from '../game';
import { findGroup } from '../model/grid';
import { zapPoints } from '../model/rules';
import type { Sim } from '../model/sim';
import { BOMB, type Kind, type SimEvent } from '../model/types';
import { Arcs } from './arcs';
import { renderBackdrop } from './backdrop';
import { handleEvent, newFxState, popBurst, type FxState, type FxTargets } from './fxEvents';
import { SCENE } from './palette';
import { Particles } from './particles';
import { PopupLayer } from './popups';
import { buildSprites, type SpriteSet } from './sprites';
import { drawCursor, drawDanger, drawPreview, drawTiles, drawTwinkle, type PreviewCell } from './tiles';
import type { View } from './view';

export interface FrameOpts { reduced: boolean; assist: boolean; time: number; dt: number; paused: boolean }

export class Renderer {
  particles = new Particles(1);
  readonly arcs = new Arcs();
  readonly popups = new PopupLayer();
  readonly state: FxState = newFxState();
  private sprites: SpriteSet | null = null;
  private backdrop: HTMLCanvasElement | null = null;
  private backdropKey = '';
  private reducedNow = false;
  private lastSim: Sim | null = null;
  private previewKey = '';
  private preview: { cells: PreviewCell[]; bomb: boolean; points: number; ids: Set<number> } | null = null;
  private seed = 0x2545f491;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    this.popups.onPop = (g): void => popBurst(this.targets(), g.x, g.y, g.kind);
  }

  private readonly rnd = (): number => {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  };

  private targets(): FxTargets {
    return { arcs: this.arcs, particles: this.particles, popups: this.popups, state: this.state, reduced: this.reducedNow, rnd: this.rnd };
  }

  /** Forward a simulation event to the effects. `sim` is the sim that produced it. */
  onEvent(e: SimEvent, sim: Sim): void { handleEvent(this.targets(), sim, e); }

  /** Drop effects tied to a previous run (new level, restart). */
  resetFx(): void {
    this.state.hideTiles = false;
    this.state.shake = this.state.flash = this.state.energy = 0;
    this.state.reject = null;
    this.popups.ghosts.forEach((g) => { g.live = false; });
  }

  private ensureCaches(v: View, assist: boolean, reduced: boolean): void {
    const key = `${v.pxW}x${v.pxH}@${v.dpr}:${v.cs.toFixed(2)}:${v.ox.toFixed(1)}:${v.oy.toFixed(1)}`;
    if (key !== this.backdropKey || !this.backdrop) { this.backdrop = renderBackdrop(v); this.backdropKey = key; }
    const px = Math.round(v.cs * v.dpr);
    if (!this.sprites || this.sprites.size !== px || this.sprites.assist !== assist) this.sprites = buildSprites(px, assist);
    if (reduced !== this.reducedNow) {
      this.reducedNow = reduced;
      this.particles = new Particles(reduced ? CONFIG.fx.reducedFactor : 1);
    }
  }

  private updatePreview(game: Game, sim: Sim): void {
    const aim = game.aim;
    const key = aim && game.phase === 'playing' ? `${aim.col},${aim.row},${sim.version},${sim.busy}` : '';
    if (key === this.previewKey) return;
    this.previewKey = key;
    this.preview = null;
    if (!aim || !key || sim.busy) return;
    const t = sim.cells[aim.row]?.[aim.col];
    if (!t) return;
    if (t.kind === BOMB) {
      const row = (sim.cells[aim.row] ?? []).filter((x): x is NonNullable<typeof x> => x !== null);
      this.preview = { cells: row.map((x) => ({ col: x.col, row: x.row })), bomb: true, points: zapPoints(row.length), ids: new Set(row.map((x) => x.id)) };
      return;
    }
    const g = findGroup(sim.cells, aim.col, aim.row);
    const ids = new Set<number>();
    for (const c of g) { const o = sim.cells[c.row]?.[c.col]; if (o) ids.add(o.id); }
    this.preview = { cells: g, bomb: false, points: zapPoints(g.length), ids };
  }

  private updateFx(dt: number, sim: Sim): void {
    const s = this.state;
    this.arcs.update(dt);
    this.particles.update(dt);
    this.popups.update(dt);
    s.shake = Math.max(0, s.shake - dt / CONFIG.fx.shakeSec);
    s.flash = Math.max(0, s.flash - dt / CONFIG.fx.flashSec);
    s.energy = Math.max(0, s.energy - dt * 1.6);
    if (s.reject) { s.reject.t += dt; if (s.reject.t > 0.3) s.reject = null; }
    if (this.lastSim !== sim) { this.lastSim = sim; s.hideTiles = false; }
  }

  draw(game: Game, v: View, o: FrameOpts): void {
    const c = this.ctx;
    const sim = game.scene;
    this.ensureCaches(v, o.assist, o.reduced);
    this.updateFx(o.paused ? 0 : o.dt, sim);
    this.updatePreview(game, sim);
    const sp = this.sprites as SpriteSet;
    const grid = CONFIG.grid.cols * v.cs;
    c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    c.clearRect(0, 0, v.pxW, v.pxH);
    c.save();
    if (this.state.shake > 0 && !o.reduced) {
      const m = this.state.shake * this.state.shake * CONFIG.fx.shakeCells * v.cs;
      c.translate(Math.sin(o.time * 91) * m, Math.cos(o.time * 73) * m);
    }
    c.drawImage(this.backdrop as HTMLCanvasElement, 0, 0, v.pxW, v.pxH);
    this.drawEnergy(c, v, grid);
    drawDanger(c, v, sim, o.time, o.reduced);
    if (!this.state.hideTiles) {
      drawTiles(c, v, sim, sp, { alpha: game.alpha, time: o.time, reduced: o.reduced, fx: this.state, hover: this.preview?.ids ?? null });
      if (!o.reduced) drawTwinkle(c, v, sim, o.time);
    }
    this.popups.drawGhosts(c, v.ox, v.oy, v.cs, (k: Kind) => sp.discs[k], sp.halo);
    if (this.preview && game.phase === 'playing') drawPreview(c, v, this.preview.cells, this.preview.bomb, this.preview.points, o.time);
    if (game.aim?.source === 'kbd' && game.phase === 'playing') drawCursor(c, v, game.aim.col, game.aim.row, o.time, o.reduced);
    this.popups.drawGlow(c, v.ox, v.oy, v.cs, grid);
    this.arcs.draw(c, v.ox, v.oy, v.cs, o.time);
    this.particles.draw(c, v.ox, v.oy, v.cs);
    this.popups.drawText(c, v.ox, v.oy, v.cs);
    c.restore();
    this.drawOverlay(c, v, sim, o.reduced);
  }

  private drawEnergy(c: CanvasRenderingContext2D, v: View, gridW: number): void {
    if (this.state.energy <= 0.01) return;
    const cx = v.ox + gridW / 2, cy = v.oy + (CONFIG.grid.rows * v.cs) / 2;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, gridW * 0.9);
    g.addColorStop(0, `rgba(185,166,255,${0.32 * this.state.energy})`); g.addColorStop(1, 'rgba(123,92,240,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, v.pxW, v.pxH); c.restore();
  }

  private drawOverlay(c: CanvasRenderingContext2D, v: View, sim: Sim, reduced: boolean): void {
    if (this.state.flash > 0.01 && !reduced) {
      c.save(); c.globalAlpha = this.state.flash; c.fillStyle = this.state.flashColour;
      c.fillRect(0, 0, v.pxW, v.pxH); c.restore();
    }
    if (sim.status === 'over' && sim.overReason === 'time') {
      c.save(); c.fillStyle = 'rgba(8,4,28,0.4)'; c.fillRect(0, 0, v.pxW, v.pxH);
      c.strokeStyle = SCENE.danger; c.globalAlpha = 0.5; c.lineWidth = 4; c.strokeRect(2, 2, v.pxW - 4, v.pxH - 4); c.restore();
    }
  }
}
