// Line (grappling cord) behaviour: growth, blocking by ledges/blocks/ceiling, sticky hold, bubble hits.
import { CONFIG } from '../config';
import { lineHitsBubble, splitChildren } from './physics';
import { emitEvent, rebuildSolids, type Sim } from './state';
import { dropPickup } from './power';

const { floorY, ceilY } = CONFIG.world;

export function fireLine(sim: Sim): void {
  const x = sim.player.x;
  sim.lines.push({ x, tipY: floorY - CONFIG.line.startOffset, pTipY: floorY - CONFIG.line.startOffset, stuck: -1 });
  sim.player.fireCd = CONFIG.line.fireCooldown;
  sim.player.shotAge = 0;
  emitEvent(sim, { type: 'fire', x });
}

function damageBlock(sim: Sim, index: number): void {
  const b = sim.blocks[index];
  if (!b) return;
  b.hp -= 1;
  const broke = b.hp <= 0;
  if (broke) { b.alive = false; sim.score += CONFIG.score.blockBreak; rebuildSolids(sim); }
  emitEvent(sim, { type: 'block', x: b.x + b.w / 2, y: b.y + b.h / 2, broke });
}

/** Where does a line at x stop? Returns the blocking underside y and which block (or -1 for a ledge). */
function blockerFor(sim: Sim, x: number, from: number, to: number): { y: number; block: number } | null {
  let best: { y: number; block: number } | null = null;
  const consider = (y: number, h: number, rx: number, rw: number, block: number): void => {
    const under = y + h;
    if (x < rx || x > rx + rw || under > from || under < to) return;
    if (!best || under > best.y) best = { y: under, block };
  };
  for (const p of sim.platforms) consider(p.y, p.h, p.x, p.w, -1);
  sim.blocks.forEach((b, i) => { if (b.alive) consider(b.y, b.h, b.x, b.w, i); });
  return best;
}

/** Advance all lines by one tick. Lines that end are removed. */
export function stepLines(sim: Sim, dt: number): void {
  const keep = [];
  for (const l of sim.lines) {
    if (l.stuck >= 0) {
      l.stuck -= dt;
      if (l.stuck > 0) keep.push(l);
      continue;
    }
    l.pTipY = l.tipY;
    const next = l.tipY - CONFIG.line.speed * dt;
    const hit = blockerFor(sim, l.x, l.tipY, next);
    if (hit) {
      l.tipY = hit.y;
      if (hit.block >= 0) { damageBlock(sim, hit.block); continue; }
      if (sim.power.sticky > 0) { l.stuck = CONFIG.line.stickyHold; keep.push(l); }
      continue;
    }
    if (next <= ceilY) {
      l.tipY = ceilY;
      if (sim.power.sticky > 0) { l.stuck = CONFIG.line.stickyHold; keep.push(l); }
      continue;
    }
    l.tipY = next;
    keep.push(l);
  }
  sim.lines = keep;
}

function awardPop(sim: Sim, size: number): number {
  const mult = Math.min(CONFIG.score.comboMax, 1 + Math.floor(sim.combo / CONFIG.score.comboStep));
  const pts = (CONFIG.score.pop[size] ?? 50) * mult;
  sim.score += pts;
  sim.combo += 1;
  sim.comboTimer = CONFIG.score.comboWindow;
  return pts;
}

/** Each line pops at most one bubble per tick (the first in array order). The line is consumed. */
export function resolveLineHits(sim: Sim): void {
  const half = CONFIG.line.width / 2;
  const survivors = [];
  for (const l of sim.lines) {
    const i = sim.bubbles.findIndex((b) => lineHitsBubble(l.x, l.tipY, half, b));
    if (i < 0) { survivors.push(l); continue; }
    const b = sim.bubbles[i]!;
    const kids = splitChildren(b, () => sim.nextId++, sim.stage.speedMul);
    sim.bubbles.splice(i, 1, ...kids);
    const points = awardPop(sim, b.size);
    emitEvent(sim, { type: 'hitLine', x: b.x, y: b.y, size: b.size, points });
    emitEvent(sim, kids.length ? { type: 'split', x: b.x, y: b.y, size: b.size } : { type: 'pop', x: b.x, y: b.y, size: b.size });
    dropPickup(sim, b.x, b.y);
  }
  sim.lines = survivors;
}
