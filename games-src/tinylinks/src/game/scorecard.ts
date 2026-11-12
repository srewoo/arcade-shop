import { relLabel, scoreKind, type ScoreKind } from './scoring';
import type { Match } from './match';

export interface Cell { text: string; kind?: ScoreKind; current?: boolean }
export interface CardRow { name: string; player: number; cells: Cell[]; total: string; rel: string }
export interface Card { heads: string[]; par: Cell[]; parTotal: string; rows: CardRow[] }

/** Column layout: every hole, plus Out/In subtotals on the full 18. */
export function buildScorecard(m: Match): Card {
  const n = m.holes.length;
  const split = n === 18;
  const cols: ({ hole: number } | { sub: 'Out' | 'In' })[] = [];
  m.holes.forEach((_, i) => {
    cols.push({ hole: i });
    if (split && (i === 8 || i === 17)) cols.push({ sub: i === 8 ? 'Out' : 'In' });
  });
  const range = (c: { sub: 'Out' | 'In' }): [number, number] => (c.sub === 'Out' ? [0, 9] : [9, 18]);
  const heads = cols.map((c) => ('hole' in c ? String((m.holes[c.hole]?.id) ?? '') : c.sub));
  const parSum = (a: number, b: number): number => m.holes.slice(a, b).reduce((s, h) => s + h.par, 0);
  const par = cols.map((c): Cell => ('hole' in c ? { text: String(m.holes[c.hole]?.par ?? '') } : { text: String(parSum(...range(c))) }));
  const rows = m.players.map((p, pi): CardRow => {
    const sc = m.scores[pi] ?? [];
    const cells = cols.map((c): Cell => {
      if ('hole' in c) {
        const s = sc[c.hole] ?? null;
        const h = m.holes[c.hole];
        if (s == null || !h) return { text: '·', current: c.hole === m.holeIdx };
        return { text: String(s), kind: scoreKind(s, h.par, m.pickups[pi]?.[c.hole]), current: c.hole === m.holeIdx };
      }
      const [a, b] = range(c);
      const part = sc.slice(a, b);
      return { text: part.some((v) => v != null) ? String(part.reduce<number>((s, v) => s + (v ?? 0), 0)) : '·' };
    });
    const t = m.total(pi);
    return { name: p.name, player: pi, cells, total: t.played ? String(t.strokes) : '·', rel: t.played ? relLabel(t.strokes - t.par) : '' };
  });
  return { heads, par, parTotal: String(parSum(0, n)), rows };
}
