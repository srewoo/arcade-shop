import { describe, expect, it } from 'vitest';
import { CONFIG } from '../src/config';
import { botInput } from '../src/sim/bot';
import { makeBubble } from '../src/sim/physics';
import { applyPower, pickKind } from '../src/sim/power';
import { createSim, stepSim, type Sim } from '../src/sim/sim';
import { resolveStage, STAGES } from '../src/sim/stages';
import type { Input } from '../src/sim/types';

const none: Input = { left: false, right: false, fire: false };
const fire: Input = { left: false, right: false, fire: true };
const { floorY } = CONFIG.world;

function stepN(sim: Sim, n: number, input: Input = none): void {
  for (let i = 0; i < n; i++) stepSim(sim, input);
}
const lone = (size: number, x = 300, y = 150): Sim => {
  const s = createSim(0);
  s.player.invuln = 0;
  s.rng = () => 0.99;
  s.bubbles = [makeBubble(99, x, y, size, 1)];
  return s;
};
const types = (s: Sim): string[] => s.events.map((e) => e.type);

describe('start and firing', () => {
  it('stays frozen until the first player action', () => {
    const s = createSim(0);
    const t = s.time;
    stepN(s, 30);
    expect(s.tick).toBe(0);
    expect(s.time).toBe(t);
    stepSim(s, { ...none, right: true });
    expect(s.started).toBe(true);
    expect(s.tick).toBe(1);
  });
  it('fires one line, limited to one without double', () => {
    const s = lone(3, 100, 100);
    stepN(s, 5, fire);
    expect(s.lines).toHaveLength(1);
    expect(types(s)).toContain('fire');
  });
  it('the line rises to the ceiling and then disappears', () => {
    const s = lone(3, 600, 100);
    s.bubbles[0]!.vx = 0;
    stepSim(s, fire);
    let ticks = 0;
    while (s.lines.length && ticks < 200) { stepSim(s, none); ticks++; }
    expect(s.lines).toHaveLength(0);
    expect(ticks).toBeGreaterThan(40);
    expect(ticks).toBeLessThan(120);
  });
});

describe('line hits and splitting', () => {
  it('splits a large bubble into two mediums and scores', () => {
    const s = lone(3, 300, 250);
    s.bubbles[0]!.vx = 0; s.bubbles[0]!.vy = 0;
    s.player.x = 300;
    stepSim(s, fire);
    stepN(s, 12);
    expect(s.bubbles.filter((b) => b.size === 2)).toHaveLength(2);
    expect(s.score).toBe(CONFIG.score.pop[3]);
    expect(s.lines).toHaveLength(0);
  });
  it('pops the smallest bubble and clears the stage with a time bonus', () => {
    const s = lone(0, 300, 330);
    s.bubbles[0]!.vx = 0; s.bubbles[0]!.vy = 0;
    s.player.x = 300;
    s.time = 20;
    stepSim(s, fire);
    stepN(s, 10);
    expect(s.status).toBe('cleared');
    const e = s.events.find((x) => x.type === 'clear');
    expect(e && e.type === 'clear' ? e.bonus : -1).toBe(Math.round(s.time) * CONFIG.score.timeBonusPerSec);
    expect(s.score).toBeGreaterThan(CONFIG.score.pop[0]!);
  });
  it('a line hits at most one bubble and is consumed', () => {
    const s = lone(1, 300, 200);
    s.bubbles = [makeBubble(1, 300, 200, 1, 1), makeBubble(2, 302, 230, 1, 1)];
    s.bubbles.forEach((b) => { b.vx = 0; b.vy = 0; });
    s.player.x = 300;
    stepSim(s, fire);
    stepN(s, 25);
    expect(s.events.filter((e) => e.type === 'hitLine')).toHaveLength(1);
  });
  it('combo multiplier grows with quick consecutive hits and resets after the window', () => {
    const s = lone(3, 300, 250);
    s.combo = CONFIG.score.comboStep * 2;
    s.comboTimer = 1;
    s.bubbles[0]!.vx = 0; s.bubbles[0]!.vy = 0;
    s.player.x = 300;
    stepSim(s, fire);
    stepN(s, 12);
    expect(s.score).toBe(CONFIG.score.pop[3]! * 3);
    s.combo = 5;
    s.comboTimer = 0.02;
    stepN(s, 3);
    expect(s.combo).toBe(0);
  });
});

describe('platforms and blocks', () => {
  it('a line is stopped by a ledge above the player', () => {
    const s = lone(0, 600, 100);
    s.bubbles[0]!.vx = 0;
    s.platforms = [{ x: 250, y: 200, w: 100, h: 9 }];
    s.solids = [...s.platforms];
    s.player.x = 300;
    stepSim(s, fire);
    stepN(s, 100);
    expect(s.lines).toHaveLength(0);
    expect(s.bubbles).toHaveLength(1);
  });
  it('chips a block per hit and breaks it at 0 hp, then lines pass', () => {
    const s = lone(0, 600, 100);
    s.bubbles[0]!.vx = 0;
    s.blocks = [{ x: 280, y: 200, w: 40, h: 30, hp: 2, maxHp: 2, alive: true }];
    s.solids = [...s.blocks];
    s.player.x = 300;
    stepSim(s, fire); stepN(s, 60);
    expect(s.blocks[0]!.hp).toBe(1);
    expect(s.blocks[0]!.alive).toBe(true);
    stepN(s, 10);
    stepSim(s, fire); stepN(s, 60);
    expect(s.blocks[0]!.alive).toBe(false);
    expect(s.solids).toHaveLength(0);
    expect(types(s)).toContain('block');
  });
});

describe('player hit, shield and timeout', () => {
  it('touching a bubble loses the stage (life cost is applied by the run)', () => {
    const s = lone(2, 300, floorY - 40);
    s.player.x = 300;
    stepSim(s, { ...none, right: true });
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('hit');
  });
  it('start invulnerability protects the player', () => {
    const s = lone(2, 300, floorY - 40);
    s.player.invuln = 1;
    s.player.x = 300;
    stepSim(s, { ...none, right: true });
    expect(s.status).toBe('play');
  });
  it('a shield absorbs exactly one hit then grants brief invulnerability', () => {
    const s = lone(2, 300, floorY - 40);
    s.player.x = 300;
    applyPower(s, 'shield');
    stepSim(s, { ...none, right: true });
    expect(s.status).toBe('play');
    expect(s.player.shield).toBe(false);
    expect(s.player.invuln).toBeGreaterThan(0);
    expect(types(s)).toContain('shieldBreak');
  });
  it('the timer running out loses the stage', () => {
    const s = lone(3, 100, 100);
    s.time = 0.05;
    stepN(s, 10, { ...none, right: true });
    expect(s.status).toBe('lost');
    expect(s.lostReason).toBe('timeout');
    expect(types(s)).toContain('timeout');
  });
  it('the demo sim never hurts', () => {
    const s = createSim(0, 0, 1, true);
    s.player.invuln = 0;
    s.bubbles = [makeBubble(9, s.player.x, floorY - 30, 2, 1)];
    stepN(s, 5);
    expect(s.status).toBe('play');
  });
  it('a finished sim no longer changes', () => {
    const s = lone(2, 300, floorY - 40);
    s.player.x = 300;
    stepSim(s, { ...none, right: true });
    const tick = s.tick;
    stepN(s, 10, fire);
    expect(s.tick).toBe(tick);
  });
});

describe('power-ups', () => {
  it('double allows two lines at once', () => {
    const s = lone(3, 600, 100);
    applyPower(s, 'double');
    stepN(s, 12, fire);
    expect(s.lines.length).toBe(2);
  });
  it('sticky keeps the line at the ceiling for the hold time', () => {
    const s = lone(3, 600, 100);
    s.bubbles[0]!.vx = 0;
    applyPower(s, 'sticky');
    stepSim(s, fire);
    stepN(s, 100);
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]!.tipY).toBe(CONFIG.world.ceilY);
    stepN(s, Math.ceil(CONFIG.line.stickyHold * 60) + 5);
    expect(s.lines).toHaveLength(0);
  });
  it('slow time scales bubble motion and expires', () => {
    const a = lone(3, 300, 100), b = lone(3, 300, 100);
    applyPower(b, 'slow');
    stepN(a, 30, { ...none, left: true });
    stepN(b, 30, { ...none, left: true });
    expect(Math.abs(b.bubbles[0]!.x - 300)).toBeCloseTo(Math.abs(a.bubbles[0]!.x - 300) * CONFIG.power.slowScale, 3);
    expect(b.power.slow).toBeLessThan(CONFIG.power.duration.slow);
    b.power.slow = 0.01;
    stepN(b, 3);
    expect(b.power.slow).toBe(0);
  });
  it('a pickup falls, is collected on contact and applies its effect', () => {
    const s = lone(3, 600, 100);
    s.player.x = 100;
    s.pickups = [{ kind: 'double', x: 100, y: floorY - 20, px: 100, py: floorY - 20, vy: 0, life: 5 }];
    stepSim(s, { ...none, left: true });
    expect(s.pickups).toHaveLength(0);
    expect(s.power.double).toBeGreaterThan(CONFIG.power.duration.double - 0.5);
    expect(types(s)).toContain('collect');
  });
  it('uncollected pickups expire', () => {
    const s = lone(3, 600, 100);
    s.pickups = [{ kind: 'slow', x: 500, y: floorY - 11, px: 500, py: 0, vy: 0, life: 0.03 }];
    stepN(s, 5, { ...none, left: true });
    expect(s.pickups).toHaveLength(0);
  });
  it('pickKind follows the weights and covers every kind', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(pickKind(i / 100));
    expect([...seen].sort()).toEqual(['double', 'shield', 'slow', 'sticky']);
    expect(pickKind(0)).toBe('double');
  });
});

describe('stages and determinism', () => {
  it('every stage layout is valid: bubbles inside the world, not inside solids', () => {
    for (const d of STAGES) {
      expect(d.bubbles.length).toBeGreaterThan(0);
      for (const b of d.bubbles) {
        expect(b.x).toBeGreaterThan(30);
        expect(b.x).toBeLessThan(CONFIG.world.w - 30);
        expect(b.y).toBeLessThan(floorY - 40);
        for (const r of [...d.platforms, ...d.blocks]) {
          const inside = b.x > r.x - 30 && b.x < r.x + r.w + 30 && b.y > r.y - 30 && b.y < r.y + r.h + 30;
          expect(inside, `${d.name} bubble overlaps solid`).toBe(false);
        }
      }
    }
  });
  it('loops past the last stage with a shorter timer and faster bubbles', () => {
    const a = resolveStage(0), b = resolveStage(STAGES.length);
    expect(b.def).toBe(a.def);
    expect(b.time).toBeLessThan(a.time);
    expect(b.speedMul).toBeGreaterThan(1);
    expect(resolveStage(500).time).toBeGreaterThanOrEqual(CONFIG.run.minTime);
    expect(resolveStage(500).speedMul).toBeLessThanOrEqual(CONFIG.run.loopSpeedMax);
  });
  it('same inputs give identical results', () => {
    const play = (): string => {
      const s = createSim(2, 0, 5);
      for (let i = 0; i < 1500 && s.status === 'play'; i++) stepSim(s, botInput(s));
      return JSON.stringify([s.score, s.tick, s.bubbles.map((b) => [b.x, b.y]), s.status]);
    };
    expect(play()).toBe(play());
  });
  it('the autopilot clears the first stages', () => {
    for (const idx of [0, 1]) {
      const s = createSim(idx, 0, 1);
      s.player.invuln = 0;
      for (let i = 0; i < 60 * 120 && s.status === 'play'; i++) stepSim(s, botInput(s));
      expect(s.status, `stage ${idx}`).toBe('cleared');
    }
  });
});
