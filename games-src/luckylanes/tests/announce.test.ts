import { describe, expect, it } from 'vitest';
import { bannerFor } from '../src/announce';
import { createMatch, recordRoll, type Match } from '../src/match';

function knock(m: Match, n: number): Match {
  const after = [...m.mask];
  let left = n;
  for (let i = 0; i < after.length && left > 0; i++) if (after[i]) { after[i] = false; left--; }
  return recordRoll(m, after);
}
const solo = (): Match => createMatch({ mode: 'solo', players: 1, cpuLevel: 'easy' });

describe('bannerFor', () => {
  it('calls strikes, turkeys and hambones', () => {
    let m = knock(solo(), 10);
    expect(bannerFor(m, 0, 10, false)?.text).toBe('STRIKE!');
    m = knock(m, 10);
    m = knock(m, 10);
    expect(bannerFor(m, 0, 10, false)).toEqual({ text: 'TURKEY!', kind: 'turkey' });
    m = knock(m, 10);
    expect(bannerFor(m, 0, 10, false)?.text).toBe('HAMBONE!');
    m = knock(m, 10);
    expect(bannerFor(m, 0, 10, false)?.text).toBe('STRIKE!');
  });
  it('calls spares only on the second ball', () => {
    let m = knock(solo(), 6);
    expect(bannerFor(m, 0, 6, false)).toBeNull();
    m = knock(m, 4);
    expect(bannerFor(m, 0, 4, false)?.kind).toBe('spare');
  });
  it('calls gutter balls only when nothing fell', () => {
    const m = knock(solo(), 0);
    expect(bannerFor(m, 0, 0, true)?.kind).toBe('gutter');
    expect(bannerFor(m, 0, 0, false)).toBeNull();
  });
  it('announces spare-challenge results', () => {
    let m = createMatch({ mode: 'spare', players: 1, cpuLevel: 'easy', seed: 3 });
    const size = (m.leaves[0] as number[]).length;
    m = knock(m, size);
    expect(bannerFor(m, 0, size, false)?.kind).toBe('spare');
    m = knock(m, 0);
    expect(bannerFor(m, 0, 0, false)?.kind).toBe('miss');
  });
});
