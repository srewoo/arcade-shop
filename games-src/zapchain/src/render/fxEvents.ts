// Turns simulation events into visual effects: arcs along the chain, bursts, pop-ups, shake.
import { CONFIG } from '../config';
import type { Sim } from '../model/sim';
import { BOMB, type Kind, type SimEvent, type ZapInfo } from '../model/types';
import { chainLabel } from '../strings';
import type { Arcs } from './arcs';
import { DISC, SCENE } from './palette';
import type { Particles } from './particles';
import { popupColour, type PopupLayer } from './popups';

export interface FxState {
  shake: number;
  flash: number;
  flashColour: string;
  /** 0..1 glow behind the board, decays. */
  energy: number;
  hideTiles: boolean;
  reject: { col: number; row: number; t: number } | null;
}

export const newFxState = (): FxState => ({ shake: 0, flash: 0, flashColour: '#ffffff', energy: 0, hideTiles: false, reject: null });

export interface FxTargets { arcs: Arcs; particles: Particles; popups: PopupLayer; state: FxState; reduced: boolean; rnd: () => number }

const stagger = (depth: number): number => Math.min(0.14, depth * (CONFIG.fx.arcStaggerSec * 0.55));

function chainFx(fx: FxTargets, kind: Kind, cells: readonly ZapInfo[]): void {
  for (const c of cells) {
    const d = stagger(c.depth);
    if (c.parent >= 0) {
      const p = cells[c.parent] as ZapInfo;
      fx.arcs.add(p.col, p.row, c.col, c.row, d - 0.015, kind);
    }
    fx.popups.ghost(c.col, c.row, c.kind, d);
  }
  const root = cells[0] as ZapInfo;
  fx.arcs.add(root.col, root.row, root.col, root.row - 0.001, 0, kind, 1.6);
  fx.popups.ring(root.col, root.row, 1.2 + Math.min(3, cells.length * 0.12), DISC[kind].glow);
}

function centroid(cells: readonly ZapInfo[]): { x: number; y: number } {
  let x = 0, y = 0;
  for (const c of cells) { x += c.col; y += c.row; }
  return { x: x / cells.length, y: y / cells.length };
}

function onZap(fx: FxTargets, e: Extract<SimEvent, { t: 'zap' }>): void {
  chainFx(fx, e.kind, e.cells);
  const mid = centroid(e.cells);
  const big = Math.min(1.5, 0.8 + e.n * 0.06);
  fx.popups.popup(`+${e.points.toLocaleString('en-US')}`, mid.x, mid.y, big, popupColour(e.kind));
  const label = chainLabel(e.n);
  if (label) fx.popups.popup(label, mid.x, mid.y - 1.1, Math.min(1.6, 0.9 + e.n * 0.04), SCENE.bolt, 1.1);
  fx.state.energy = Math.max(fx.state.energy, Math.min(1, e.n / 10));
  if (fx.reduced) return;
  if (e.n >= 5) fx.state.shake = Math.max(fx.state.shake, Math.min(1, (e.n - 3) / 14));
  if (e.n >= 10) { fx.state.flash = Math.min(0.5, 0.12 + e.n * 0.012); fx.state.flashColour = DISC[e.kind].glow; }
}

function onBomb(fx: FxTargets, e: Extract<SimEvent, { t: 'bomb' }>): void {
  fx.popups.beam(e.row);
  for (const c of e.cells) {
    const d = stagger(c.depth) * 1.2;
    fx.popups.ghost(c.col, c.row, c.kind, d);
    if (c.col === e.col) continue;
    const from = c.col > e.col ? c.col - 1 : c.col + 1;
    fx.arcs.add(from, e.row, c.col, e.row, d - 0.02, BOMB, 1.5);
  }
  fx.popups.ring(e.col, e.row, 3.4, DISC[BOMB].glow);
  fx.popups.popup('BOOM!', e.col, e.row - 0.2, 1.5, SCENE.bolt, 1.1);
  fx.popups.popup(`+${e.points.toLocaleString('en-US')}`, e.col, e.row + 0.8, 1, popupColour('bomb'));
  fx.state.energy = 1;
  if (fx.reduced) return;
  fx.state.shake = 1;
  fx.state.flash = 0.45;
  fx.state.flashColour = '#ffe7a3';
}

function onCleared(fx: FxTargets, sim: Sim): void {
  fx.state.hideTiles = true;
  for (const t of sim.tiles) fx.popups.ghost(t.x, t.y, t.kind, (CONFIG.grid.floorRow - t.row) * 0.035 + t.col * 0.008);
  fx.state.energy = 1;
  if (fx.reduced) return;
  fx.state.shake = 0.8;
  fx.state.flash = 0.4;
  fx.state.flashColour = '#cdbfff';
}

/** Burst a few sparks and shards where a disc pops. Counts scale down with the particle pool. */
export function popBurst(fx: FxTargets, x: number, y: number, kind: Kind): void {
  const col = DISC[kind];
  const cx = x + 0.5, cy = y + 0.5;
  fx.particles.burst(cx, cy, 3, 5.5, col.light, 'spark', fx.rnd);
  fx.particles.burst(cx, cy, 2, 4, col.base, 'shard', fx.rnd);
  fx.particles.burst(cx, cy, 1, 3, '#ffffff', 'spark', fx.rnd);
}

export function handleEvent(fx: FxTargets, sim: Sim, e: SimEvent): void {
  switch (e.t) {
    case 'zap': onZap(fx, e); break;
    case 'bomb': onBomb(fx, e); break;
    case 'invalid': fx.state.reject = { col: e.col, row: e.row, t: 0 }; break;
    case 'wipe': fx.popups.popup(`BOARD CLEARED +${e.bonus}`, 4.5, 5.5, 1.3, SCENE.bolt, 1.5); fx.state.energy = 1; break;
    case 'cleared': onCleared(fx, sim); break;
    case 'over':
      if (e.reason === 'full' && !fx.reduced) { fx.state.shake = 0.9; fx.state.flash = 0.35; fx.state.flashColour = SCENE.danger; }
      break;
    default: break;
  }
}
