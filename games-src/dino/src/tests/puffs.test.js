import { describe, it, expect } from 'vitest';
import { DustPuffs } from '../fx/puffs.js';

const alive = (p) => p.items.filter((i) => i.life > 0).length;
const scene = { add() {} };
const origin = { x: 0, y: 1, z: 0 };

describe('dust puffs', () => {
  it('emits the requested count at full motion', () => {
    const p = new DustPuffs(scene);
    p.puff(origin, 10, 1, 0);
    expect(alive(p)).toBe(10);
  });
  it('cuts the count to 40% under reduced motion (at least 1)', () => {
    const p = new DustPuffs(scene);
    p.scale = 0.4;
    p.puff(origin, 10, 1, 0);
    expect(alive(p)).toBe(4);
    p.puff(origin, 1, 1, 0);
    expect(alive(p)).toBe(5);
  });
  it('rings radiate in the x/y plane at the pickup height', () => {
    const p = new DustPuffs(scene);
    p.ring({ x: 0, y: 1.4, z: -5 }, 12, 1);
    const live = p.items.filter((i) => i.life > 0);
    expect(live.length).toBe(12);
    expect(live.every((i) => i.pos.y === 1.4 && i.pos.z === -5 && i.vel.z === 0)).toBe(true);
    expect(Math.max(...live.map((i) => i.vel.x))).toBeGreaterThan(3);
  });
});
